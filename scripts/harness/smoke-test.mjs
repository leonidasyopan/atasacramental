#!/usr/bin/env node

/**
 * Production Smoke Test Harness
 *
 * Verifies that the deployed application is live, healthy, responsive,
 * and that core assets and routes respond with status 200 and expected headers.
 */

import https from 'node:https';
import process from 'node:process';

const PRODUCTION_URL = 'https://sacramentalmeeting.web.app';

console.log('🩺 Running Production Smoke Test Harness...\n');
console.log(`Target: ${PRODUCTION_URL}\n`);

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function runSmokeTests() {
  const startTime = Date.now();
  let failed = false;

  // Test 1: Root HTML endpoint
  console.log('▶ Test 1: Fetching Root HTML (SPA entrypoint)...');
  try {
    const rootRes = await fetchUrl(PRODUCTION_URL);
    if (rootRes.statusCode !== 200) {
      console.error(`❌ Root endpoint returned HTTP ${rootRes.statusCode} (expected 200)`);
      failed = true;
    } else {
      console.log(`✔ Root endpoint OK (HTTP 200)`);
    }

    // Verify critical HTML markers
    if (!rootRes.body.includes('<div id="root">')) {
      console.error('❌ Root HTML missing <div id="root"> container');
      failed = true;
    } else {
      console.log('✔ Root container container verified');
    }

    if (!rootRes.body.includes('Ata da Reunião Sacramental')) {
      console.error('❌ Root HTML missing title "Ata da Reunião Sacramental"');
      failed = true;
    } else {
      console.log('✔ Title marker verified');
    }

    // Test 2: Asset links extraction and healthcheck
    console.log('\n▶ Test 2: Checking Production Bundles (JS & CSS)...');
    const assetMatches = rootRes.body.match(/\/assets\/[a-zA-Z0-9_\-.]+\.(js|css)/g) || [];
    const uniqueAssets = Array.from(new Set(assetMatches));

    if (uniqueAssets.length === 0) {
      console.error('❌ No asset bundles found in production HTML');
      failed = true;
    } else {
      console.log(`Found ${uniqueAssets.length} asset bundle(s) to verify:`);
      for (const assetPath of uniqueAssets) {
        const assetUrl = `${PRODUCTION_URL}${assetPath}`;
        try {
          const assetRes = await fetchUrl(assetUrl);
          if (assetRes.statusCode === 200) {
            console.log(`  ✔ Asset OK: ${assetPath} (HTTP 200, ${assetRes.body.length} bytes)`);
          } else {
            console.error(`  ❌ Asset failed: ${assetPath} (HTTP ${assetRes.statusCode})`);
            failed = true;
          }
        } catch (err) {
          console.error(`  ❌ Failed to reach asset ${assetUrl}: ${err.message}`);
          failed = true;
        }
      }
    }

    // Test 3: SPA Rewrites & Routing check
    console.log('\n▶ Test 3: Testing SPA Routing Rewrites (/admin/members)...');
    const adminRes = await fetchUrl(`${PRODUCTION_URL}/admin/members`);
    if (adminRes.statusCode === 200 && adminRes.body.includes('<div id="root">')) {
      console.log('✔ SPA rewrite rule verified (/admin/members returns index.html)');
    } else {
      console.error(`❌ SPA rewrite failed: HTTP ${adminRes.statusCode}`);
      failed = true;
    }

  } catch (err) {
    console.error(`❌ Network error while connecting to ${PRODUCTION_URL}:`, err.message);
    failed = true;
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log('\n===============================================================');
  if (failed) {
    console.error(`❌ SMOKE TEST FAILED! [${duration}s]`);
    console.error('Production deployment has issues that need investigation.');
    console.log('===============================================================\n');
    process.exit(1);
  } else {
    console.log(`🎉 ALL PRODUCTION SMOKE TESTS PASSED! [${duration}s]`);
    console.log('   Production environment is healthy, responsive, and operational.');
    console.log('===============================================================\n');
    process.exit(0);
  }
}

runSmokeTests();
