#!/usr/bin/env node
/**
 * Initial Firestore seed for project `sacramentalmeeting`.
 *
 * Usage:
 *   export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
 *   node scripts/seed.mjs
 *
 * Creates:
 *   - allowedUsers/leonidasyopan@gmail.com        (superadmin, unitId 2322846)
 *   - allowedUsers/bruno.barbosa.sud@gmail.com    (user, unitId 2322846)
 *   - units/2322846                                (name: Imperatriz, type: Ramo)
 *   - units/2322846/leaders/*                      (3 leaders; customize below)
 *
 * Re-running is safe — uses merge writes.
 */
import { readFileSync } from 'node:fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const PROJECT_ID = 'sacramentalmeeting';
const UNIT_ID = '2322846';

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

async function main() {
  const credential = cert(loadServiceAccount());
  initializeApp({ credential, projectId: PROJECT_ID });
  const db = getFirestore();

  console.log('Seeding allowedUsers...');
  await db.doc('allowedUsers/leonidasyopan@gmail.com').set({
    email: 'leonidasyopan@gmail.com',
    unitId: UNIT_ID,
    role: 'superadmin',
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  await db.doc('allowedUsers/bruno.barbosa.sud@gmail.com').set({
    email: 'bruno.barbosa.sud@gmail.com',
    unitId: UNIT_ID,
    role: 'user',
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  console.log(`Seeding units/${UNIT_ID}...`);
  await db.doc(`units/${UNIT_ID}`).set({
    name: 'Imperatriz',
    type: 'Ramo',
    stake: 'Estaca Palhoça',
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  console.log('Seeding initial leaders...');
  const leaders = [
    { name: 'Leônidas Yopán', calling: 'Presidente do Ramo', order: 0 },
    { name: 'Thiago Sodré Pimentel Santos', calling: '1º Conselheiro', order: 1 },
    { name: 'Eloi Roque Sangaletto', calling: '2º Conselheiro', order: 2 },
  ];
  for (const leader of leaders) {
    const query = await db
      .collection(`units/${UNIT_ID}/leaders`)
      .where('name', '==', leader.name)
      .limit(1)
      .get();
    if (!query.empty) {
      await query.docs[0].ref.set({ ...leader, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    } else {
      await db.collection(`units/${UNIT_ID}/leaders`).add({
        ...leader,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  }

  console.log('Seed complete.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
