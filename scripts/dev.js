#!/usr/bin/env node

import {
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

function startNextDev() {
  log('NEXT', colors.blue, 'Starting Next.js dev server...');
  return spawnWithPrefix('pnpm', ['dev'], DASHBOARD_DIR, 'NEXT', colors.blue);
}

async function main() {
  console.log('\n🌾 FieldMCP Development Environment\n');

  const { stripeProc } = await initializeEnvironment();

  // Start Next.js dev server immediately (can compile while Supabase starts)
  logInfo('Starting Next.js and Supabase in parallel...');
  const nextProc = startNextDev();

  // Start Supabase (Edge Functions need to wait for this)
  const supabaseCreds = await startSupabase();
  log('SUPABASE', colors.green, 'Started successfully!');

  if (supabaseCreds.studioUrl) {
    log('SUPABASE', colors.green, `Studio: ${supabaseCreds.studioUrl}`);
  }

  // Start Edge Functions (after Supabase is ready)
  const functionsProc = startSupabaseFunctions();

  console.log(`\n${'─'.repeat(50)}`);
  logInfo('All services started!');
  logInfo('Dashboard: http://localhost:3000');
  logInfo('MCP Gateway: http://127.0.0.1:54321/functions/v1/mcp-gateway');
  logInfo('John Deere MCP: http://127.0.0.1:54321/functions/v1/mcp-john-deere');
  logInfo(`Supabase Studio: ${supabaseCreds.studioUrl}`);
  console.log(`${'─'.repeat(50)}\n`);

  setupCleanup([nextProc, functionsProc, stripeProc]);
}

main().catch((err) => {
  log('ERROR', colors.red, err.message);
  process.exit(1);
});
