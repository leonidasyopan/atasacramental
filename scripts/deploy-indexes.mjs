#!/usr/bin/env node
/**
 * Deploys Firestore composite indexes via the Firestore Admin REST API,
 * using the firebase-admin-managed access token from the service account.
 *
 * Reads `firestore.indexes.json` at the repo root.
 * Only requires `datastore.indexes.create` permission (included in the
 * "Cloud Datastore Index Admin" or Firebase Admin SDK role). It does NOT
 * require the `serviceusage` permissions that `firebase-tools` checks for.
 *
 * Usage:
 *   export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
 *   node scripts/deploy-indexes.mjs
 */
import { readFileSync } from 'node:fs';
import { GoogleAuth } from 'google-auth-library';

const PROJECT_ID = 'sacramentalmeeting';
const DATABASE = '(default)';
const API = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE}`;

function loadServiceAccount() {
  const path = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (path) return JSON.parse(readFileSync(path, 'utf8'));
  if (process.env.FIREBASE_SERVICE_ACCOUNT)
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  throw new Error('Set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT');
}

async function getAccessToken(sa) {
  const auth = new GoogleAuth({
    credentials: sa,
    scopes: ['https://www.googleapis.com/auth/datastore'],
  });
  const client = await auth.getClient();
  const res = await client.getAccessToken();
  return res.token;
}

async function createIndex(token, idx) {
  const url = `${API}/collectionGroups/${idx.collectionGroup}/indexes`;
  const body = {
    queryScope: idx.queryScope || 'COLLECTION',
    fields: idx.fields.map((f) => ({
      fieldPath: f.fieldPath,
      order: f.order,
    })),
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    // 409 = already exists — treat as success
    const msg = json?.error?.message || res.statusText;
    if (res.status === 409 || /already exists/i.test(msg)) {
      return { status: 'exists', idx };
    }
    throw new Error(`${idx.collectionGroup} ${res.status} ${msg}`);
  }
  return { status: 'created', idx, operation: json.name };
}

async function main() {
  const sa = loadServiceAccount();
  const token = await getAccessToken(sa);
  const spec = JSON.parse(readFileSync('firestore.indexes.json', 'utf8'));
  for (const idx of spec.indexes) {
    const fieldsDesc = idx.fields.map((f) => `${f.fieldPath}:${f.order[0]}`).join(',');
    try {
      const r = await createIndex(token, idx);
      console.log(`${r.status.padEnd(8)} ${idx.collectionGroup} (${fieldsDesc})`);
    } catch (e) {
      console.error(`FAILED   ${idx.collectionGroup} (${fieldsDesc}): ${e.message}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
