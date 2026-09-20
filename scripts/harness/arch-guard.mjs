#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');

const errors = [];
const warnings = [];

console.log('🛡️  Running Architectural & Business Guardrails...\n');

// ----------------------------------------------------------------------------
// Check 1: Layer Boundary Enforcement
// UI Components & Pages must NOT import directly from 'firebase/firestore'
// (All database access must be mediated through src/services/)
// ----------------------------------------------------------------------------
function checkUiLayerBoundaries() {
  const targetDirs = [
    path.join(ROOT_DIR, 'src/components'),
    path.join(ROOT_DIR, 'src/pages'),
  ];

  function scanDir(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (/\.(jsx?|tsx?)$/.test(entry.name) && !entry.name.includes('.test.')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (
          content.includes("from 'firebase/firestore'") ||
          content.includes('from "firebase/firestore"')
        ) {
          const relative = path.relative(ROOT_DIR, fullPath);
          errors.push(
            `[Boundary Violation] ${relative} imports directly from 'firebase/firestore'. UI layers must use services in src/services/.`
          );
        }
      }
    }
  }

  for (const dir of targetDirs) {
    scanDir(dir);
  }
}

// ----------------------------------------------------------------------------
// Check 2: Sensitive Files & Secrets Detection
// Ensure no serviceAccount or private credentials leaked into src or test
// ----------------------------------------------------------------------------
function checkCredentialLeaks() {
  const forbiddenFiles = [
    'serviceAccountKey.json',
    'firebase-adminsdk.json',
    '.env.local',
    '.env.production',
  ];

  for (const f of forbiddenFiles) {
    const fullPath = path.join(ROOT_DIR, f);
    if (fs.existsSync(fullPath)) {
      warnings.push(`[Security Warning] ${f} is present in repository root. Ensure it is ignored by .gitignore.`);
    }
  }
}

// ----------------------------------------------------------------------------
// Check 3: Business Invariants Verification
// Statically verifies that critical business defaults in source code remain intact
// ----------------------------------------------------------------------------
function checkBusinessInvariants() {
  const atasPath = path.join(ROOT_DIR, 'src/services/atas.js');
  if (fs.existsSync(atasPath)) {
    const content = fs.readFileSync(atasPath, 'utf8');
    // Verify default agenda section states
    if (
      !content.includes('abertura: true') ||
      !content.includes('apoios: false') ||
      !content.includes('ordenacoes: false') ||
      !content.includes('confirmacoes: false') ||
      !content.includes('bencao: false') ||
      !content.includes('assinaturas: false')
    ) {
      errors.push('[Business Invariant Violation] DEFAULT_ATA.sectionEnabled states in src/services/atas.js have deviated from required defaults.');
    }
  }

  const speakerHelpersPath = path.join(ROOT_DIR, 'src/utils/speakerHelpers.js');
  if (fs.existsSync(speakerHelpersPath)) {
    const content = fs.readFileSync(speakerHelpersPath, 'utf8');
    if (!content.includes("'11+'") || !content.includes("'11-17'")) {
      errors.push('[Business Invariant Violation] Age group filters (11+ and 11-17) missing in src/utils/speakerHelpers.js.');
    }
    if (!content.includes('isFirstSundayOfMonth') || !content.includes('getDefaultMeetingMode')) {
      errors.push('[Business Invariant Violation] First Sunday meeting mode helpers missing in src/utils/speakerHelpers.js.');
    }
  }
}

// Run all checks
checkUiLayerBoundaries();
checkCredentialLeaks();
checkBusinessInvariants();

if (warnings.length > 0) {
  console.log('⚠️  Warnings:');
  warnings.forEach((w) => console.log(`  ${w}`));
  console.log();
}

if (errors.length > 0) {
  console.error('❌ Architectural Guardrail Violations:');
  errors.forEach((e) => console.error(`  ${e}`));
  console.error('\nPlease resolve the violations above before committing.\n');
  process.exit(1);
}

console.log('✅ All Architectural & Business Guardrails passed successfully!\n');
process.exit(0);
