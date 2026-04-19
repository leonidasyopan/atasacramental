#!/usr/bin/env node
/**
 * Deploys Firestore security rules using firebase-admin (no firebase-tools required).
 * Uses service-account credentials — does not require serviceusage.services.get.
 *
 * Usage:
 *   export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
 *   node scripts/deploy-rules.mjs
 */
import { readFileSync } from 'node:fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getSecurityRules } from 'firebase-admin/security-rules';

const PROJECT_ID = 'sacramentalmeeting';

function loadServiceAccount() {
  const fromEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (fromEnv) return JSON.parse(fromEnv);
  const path = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!path) throw new Error('Set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT');
  return JSON.parse(readFileSync(path, 'utf8'));
}

async function main() {
  initializeApp({ credential: cert(loadServiceAccount()), projectId: PROJECT_ID });
  const source = readFileSync('firestore.rules', 'utf8');
  const release = await getSecurityRules().releaseFirestoreRulesetFromSource(source);
  console.log(`Firestore rules released: ${release.rulesetName || release.name}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
