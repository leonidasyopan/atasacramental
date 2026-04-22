#!/usr/bin/env node
/**
 * Imports parsed households + members into Firestore.
 *
 * Usage:
 *   export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
 *   node scripts/import-members/import-to-firestore.mjs
 *   # optional flags:
 *   #   MEMBERS_JSON=path/to/parsed.json
 *   #   DRY_RUN=1 (only logs what would be written)
 *
 * Writes (idempotent, merge-based):
 *   units/{unitId}/households/{householdId}
 *   units/{unitId}/members/{memberId}
 *
 * Both `householdId` and `memberId` are deterministic SHA-1 hashes, so
 * re-running the script will update existing docs in place instead of
 * creating duplicates.
 */
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const PROJECT_ID = 'sacramentalmeeting';
const UNIT_ID = '2322846';
const SOURCE_TAG = 'import-2026-04';
const DEFAULT_JSON = new URL('./parsed.json', import.meta.url).pathname;
const INPUT_PATH = process.env.MEMBERS_JSON || DEFAULT_JSON;
const DRY_RUN = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true';

function loadServiceAccount() {
  const fromEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (fromEnv) return JSON.parse(fromEnv);
  const path = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!path) {
    throw new Error(
      'Set GOOGLE_APPLICATION_CREDENTIALS to the path of the service account JSON, ' +
        'or FIREBASE_SERVICE_ACCOUNT to its content.',
    );
  }
  return JSON.parse(readFileSync(path, 'utf8'));
}

function normalize(s) {
  return (s || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function shortHash(input, bytes = 10) {
  return createHash('sha1').update(input).digest('hex').slice(0, bytes * 2);
}

function householdIdFor(h) {
  return `h_${shortHash(`${SOURCE_TAG}|${normalize(h.displayName)}`, 8)}`;
}

function memberIdFor(householdId, m) {
  return `m_${shortHash(
    `${householdId}|${normalize(m.fullName)}|${m.householdRole}`,
    8,
  )}`;
}

async function main() {
  console.log(`Reading ${INPUT_PATH}`);
  const { summary, households } = JSON.parse(readFileSync(INPUT_PATH, 'utf8'));
  console.log(
    `Loaded ${summary.householdCount} households, ${summary.memberCount} members`,
  );

  if (DRY_RUN) {
    console.log('DRY_RUN — listing IDs only, nothing will be written.');
  }

  const credential = cert(loadServiceAccount());
  initializeApp({ credential, projectId: PROJECT_ID });
  const db = getFirestore();

  // Collect refs first, then read them in parallel to decide which docs
  // already exist. For existing docs we omit `createdAt` so re-running the
  // script doesn't overwrite the original creation timestamp (mirrors the
  // pattern in src/services/users.js).
  const plannedOps = [];
  for (const h of households) {
    const householdId = householdIdFor(h);
    plannedOps.push({
      kind: 'household',
      ref: db.doc(`units/${UNIT_ID}/households/${householdId}`),
      data: {
        name: h.familyName,
        displayName: h.displayName,
        headNames: h.headNames,
        phone: h.phone || null,
        address: h.address || null,
        active: true,
        source: SOURCE_TAG,
        updatedAt: FieldValue.serverTimestamp(),
      },
    });
    for (const m of h.members) {
      const memberId = memberIdFor(householdId, m);
      plannedOps.push({
        kind: 'member',
        ref: db.doc(`units/${UNIT_ID}/members/${memberId}`),
        data: {
          // Back-compat: existing UI + MemberPicker read `name` + `active`.
          name: m.fullName,
          active: m.active !== false,
          // New fields
          fullName: m.fullName,
          givenName: m.givenName || null,
          familyName: m.familyName || null,
          gender: m.gender || null,
          age: m.age ?? null,
          ageAsOf: m.ageAsOf || null,
          birthDate: m.birthDate || null,
          householdId,
          householdRole: m.householdRole || 'other',
          source: SOURCE_TAG,
          updatedAt: FieldValue.serverTimestamp(),
        },
      });
    }
  }

  console.log(`Reading ${plannedOps.length} existing docs to preserve createdAt...`);
  const snaps = plannedOps.length
    ? await db.getAll(...plannedOps.map((op) => op.ref))
    : [];
  let newCount = 0;
  let updateCount = 0;
  for (let i = 0; i < plannedOps.length; i += 1) {
    if (snaps[i].exists) {
      updateCount += 1;
    } else {
      plannedOps[i].data.createdAt = FieldValue.serverTimestamp();
      newCount += 1;
    }
  }
  console.log(`new=${newCount}, update=${updateCount}`);

  let batch = db.batch();
  let opCount = 0;
  let householdOps = 0;
  let memberOps = 0;

  async function flush() {
    if (opCount === 0) return;
    if (DRY_RUN) {
      console.log(`[dry-run] would commit ${opCount} ops`);
    } else {
      await batch.commit();
      console.log(`committed batch (${opCount} ops)`);
    }
    batch = db.batch();
    opCount = 0;
  }

  for (const op of plannedOps) {
    if (!DRY_RUN) {
      batch.set(op.ref, op.data, { merge: true });
    }
    opCount += 1;
    if (op.kind === 'household') householdOps += 1;
    else memberOps += 1;
    if (opCount >= 450) await flush();
  }
  await flush();

  console.log(
    `Done. households=${householdOps}, members=${memberOps}, dryRun=${DRY_RUN}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
