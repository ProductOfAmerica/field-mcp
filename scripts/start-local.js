#!/usr/bin/env node

import { execSync } from 'node:child_process';
import {
  checkDependencies,
  checkDockerRunning,
  colors,
  DASHBOARD_DIR,
  log,
  setupCleanup,
  spawnWithPrefix,
  startStripeWebhook,
  startSupabase,
  startSupabaseFunctions,
  updateEnvFile,
} from './lib/utils.js';

function copyTypes() {
  log('TYPES', colors.yellow, 'Copying shared types to Edge Functions...');
  execSync('node scripts/copy-types.js', { stdio: 'inherit' });
}

function buildNext() {
  log('NEXT', colors.blue, 'Building Next.js for production...');
  execSync('pnpm build', { cwd: DASHBOARD_DIR, stdio: 'inherit' });
  log('NEXT', colors.blue, 'Build complete!');
}

function startNextProd() {
  log('NEXT', colors.blue, 'Starting Next.js production server...');
  return spawnWithPrefix('pnpm', ['start'], DASHBOARD_DIR, 'NEXT', colors.blue);
}

async function main() {
  console.log('\n🌾 FieldMCP Local Production Environment\n');

  checkDockerRunning();
  const { hasStripe } = checkDependencies();
  copyTypes();

  const supabaseCreds = await startSupabase();
  log('SUPABASE', colors.green, 'Started successfully!');

  if (supabaseCreds.studioUrl) {
    log('SUPABASE', colors.green, `Studio: ${supabaseCreds.studioUrl}`);
  }

  let stripeProc = null;
  let stripeWebhookSecret = null;

  if (hasStripe) {
    const stripe = await startStripeWebhook();
    stripeProc = stripe.proc;
    stripeWebhookSecret = stripe.webhookSecret;
  }

  updateEnvFile(supabaseCreds, stripeWebhookSecret);

  buildNext();

  const functionsProc = startSupabaseFunctions();
  const nextProc = startNextProd();

  console.log(`\n${'─'.repeat(50)}`);
  log('INFO', colors.cyan, 'All services started in PRODUCTION mode!');
  log('INFO', colors.cyan, 'Dashboard: http://localhost:3000');
  log(
    'INFO',
    colors.cyan,
    'MCP Gateway: http://127.0.0.1:54321/functions/v1/mcp-gateway',
  );
  log(
    'INFO',
    colors.cyan,
    'John Deere MCP: http://127.0.0.1:54321/functions/v1/mcp-john-deere',
  );
  log(
    'INFO',
    colors.cyan,
    `Supabase Studio: ${supabaseCreds.studioUrl || 'http://127.0.0.1:54323'}`,
  );
  console.log(`${'─'.repeat(50)}\n`);

  setupCleanup([nextProc, functionsProc, stripeProc]);
}

main().catch((err) => {
  log('ERROR', colors.red, err.message);
  process.exit(1);
});
