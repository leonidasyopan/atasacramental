#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import process from 'node:process';

console.log('🚀 Running Unified Development & Quality Verification Harness...\n');

const STEPS = [
  {
    name: '1. Architectural & Business Guardrails',
    command: 'node',
    args: ['scripts/harness/arch-guard.mjs'],
  },
  {
    name: '2. Code Quality & Linting (ESLint)',
    command: 'npm',
    args: ['run', 'lint'],
  },
  {
    name: '3. Automated Test Suite (Vitest)',
    command: 'npm',
    args: ['test'],
  },
  {
    name: '4. Production Bundle Build (Vite)',
    command: 'npm',
    args: ['run', 'build'],
  },
];

const startTime = Date.now();

for (const step of STEPS) {
  console.log(`▶ Executing: ${step.name}...`);
  const stepStart = Date.now();
  const res = spawnSync(step.command, step.args, {
    stdio: 'inherit',
    shell: true,
  });

  const stepDuration = ((Date.now() - stepStart) / 1000).toFixed(2);

  if (res.status !== 0) {
    console.error(`\n❌ Step failed: ${step.name} (exited with code ${res.status}) [${stepDuration}s]`);
    console.error('Please fix the errors above before continuing.\n');
    process.exit(res.status || 1);
  }

  console.log(`✔ Passed: ${step.name} [${stepDuration}s]\n`);
}

const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
console.log('===============================================================');
console.log(`🎉 ALL VERIFICATION CHECKS PASSED! [Total: ${totalDuration}s]`);
console.log('   The repository is clean, resilient, and ready for Production.');
console.log('===============================================================\n');
process.exit(0);
