#!/usr/bin/env node

import { spawn } from 'node:child_process';
import {
  attachPrefixedOutputHandlers,
  colors,
  DASHBOARD_DIR,
  initializeEnvironment,
  log,
  logInfo,
  setupCleanup,
  spawnWithPrefix,
  startSupabase,
  startSupabaseFunctions,
} from './lib/utils.js';

/**
 * Builds Next.js for production asynchronously.
 * Returns a Promise that resolves when the build completes.
 */
function buildNext() {
  log('NEXT', colors.blue, 'Building Next.js for production...');

  return new Promise((resolve, reject) => {
    const proc = spawn('pnpm', ['build'], {
      cwd: DASHBOARD_DIR,
      shell: true,
      stdio: 'pipe',
    });

    attachPrefixedOutputHandlers(proc, 'NEXT', colors.blue);

    proc.on('error', (err) => {
      reject(new Error(`Failed to spawn Next.js build: ${err.message}`));
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Next.js build failed with code ${code}`));
        return;
      }
      log('NEXT', colors.blue, 'Build complete!');
      resolve();
    });
  });
}

function startNextProd() {
  log('NEXT', colors.blue, 'Starting Next.js production server...');
  return spawnWithPrefix('pnpm', ['start'], DASHBOARD_DIR, 'NEXT', colors.blue);
}

async function main() {
  console.log('\n🌾 FieldMCP Local Production Environment\n');

  const { stripeProc } = await initializeEnvironment();

  // Run Supabase start and Next.js build in PARALLEL
  // This is the main optimization - these two can run concurrently
  logInfo('Starting Supabase and Next.js build in parallel...');

  const [supabaseCreds] = await Promise.all([startSupabase(), buildNext()]);

  log('SUPABASE', colors.green, 'Started successfully!');
  if (supabaseCreds.studioUrl) {
    log('SUPABASE', colors.green, `Studio: ${supabaseCreds.studioUrl}`);
  }

  // Start the services now that both Supabase and build are ready
  const functionsProc = startSupabaseFunctions();
  const nextProc = startNextProd();

  console.log(`\n${'─'.repeat(50)}`);
  logInfo('All services started in PRODUCTION mode!');
  logInfo('Dashboard: http://localhost:3000');
  logInfo('MCP Gateway: http://127.0.0.1:54321/functions/v1/mcp-gateway');
  logInfo('John Deere MCP: http://127.0.0.1:54321/functions/v1/mcp-john-deere');
  logInfo(
    `Supabase Studio: ${supabaseCreds.studioUrl || 'http://127.0.0.1:54323'}`,
  );
  console.log(`${'─'.repeat(50)}\n`);

  setupCleanup([nextProc, functionsProc, stripeProc]);
}

main().catch((err) => {
  log('ERROR', colors.red, err.message);
  process.exit(1);
});
