#!/usr/bin/env node

import { execSync } from 'node:child_process';
import {
  checkDependencies,
  checkDockerRunning,
  cleanWranglerCache,
  colors,
  DASHBOARD_DIR,
  GATEWAY_DIR,
  JOHN_DEERE_DIR,
  log,
  setupCleanup,
  spawnWithPrefix,
  startStripeWebhook,
  startSupabase,
  startSupabaseFunctions,
  updateEnvFile,
} from './lib/utils.js';

function buildNext() {
  log('NEXT', colors.blue, 'Building Next.js for production...');
  execSync('pnpm build', { cwd: DASHBOARD_DIR, stdio: 'inherit' });
  log('NEXT', colors.blue, 'Build complete!');
}

function startNextProd() {
  log('NEXT', colors.blue, 'Starting Next.js production server...');
  return spawnWithPrefix('pnpm', ['start'], DASHBOARD_DIR, 'NEXT', colors.blue);
}

function startMcpGateway() {
  log('GATEWAY', colors.cyan, 'Starting MCP Gateway on port 8787...');
  return spawnWithPrefix(
    'pnpm',
    ['dev', '--port', '8787'],
    GATEWAY_DIR,
    'GATEWAY',
    colors.cyan,
  );
}

function startMcpJohnDeere() {
  log('JOHN-DEERE', colors.green, 'Starting John Deere MCP on port 8788...');
  return spawnWithPrefix(
    'pnpm',
    ['dev', '--port', '8788'],
    JOHN_DEERE_DIR,
    'JOHN-DEERE',
    colors.green,
  );
}

async function main() {
  console.log('\n🌾 AgriMCP Local Production Environment\n');

  cleanWranglerCache();
  checkDockerRunning();
  const { hasStripe } = checkDependencies();

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
  const gatewayProc = startMcpGateway();
  const johnDeereProc = startMcpJohnDeere();

  console.log(`\n${'─'.repeat(50)}`);
  log('INFO', colors.cyan, 'All services started in PRODUCTION mode!');
  log('INFO', colors.cyan, 'Dashboard: http://localhost:3000');
  log('INFO', colors.cyan, 'MCP Gateway: http://localhost:8787');
  log('INFO', colors.cyan, 'John Deere MCP: http://localhost:8788');
  log(
    'INFO',
    colors.cyan,
    `Supabase Studio: ${supabaseCreds.studioUrl || 'http://127.0.0.1:54323'}`,
  );
  console.log(`${'─'.repeat(50)}\n`);

  setupCleanup([
    nextProc,
    functionsProc,
    stripeProc,
    gatewayProc,
    johnDeereProc,
  ]);
}

main().catch((err) => {
  log('ERROR', colors.red, err.message);
  process.exit(1);
});
