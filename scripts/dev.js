#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  checkDependencies,
  checkDockerRunning,
  cleanWranglerCache,
  colors,
  DASHBOARD_DIR,
  ENV_FILE,
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

function checkSecretsMatch() {
  const gatewayDevVars = join(GATEWAY_DIR, '.dev.vars');
  const johnDeereDevVars = join(JOHN_DEERE_DIR, '.dev.vars');

  if (!existsSync(gatewayDevVars) || !existsSync(johnDeereDevVars)) {
    return;
  }

  const gatewayContent = readFileSync(gatewayDevVars, 'utf-8');
  const johnDeereContent = readFileSync(johnDeereDevVars, 'utf-8');

  const gatewaySecretMatch = gatewayContent.match(/GATEWAY_SECRET=(.+)/);
  const johnDeereSecretMatch = johnDeereContent.match(/GATEWAY_SECRET=(.+)/);

  if (gatewaySecretMatch && johnDeereSecretMatch) {
    if (gatewaySecretMatch[1].trim() !== johnDeereSecretMatch[1].trim()) {
      log('ERROR', colors.red, 'GATEWAY_SECRET MISMATCH!');
      log(
        'ERROR',
        colors.red,
        `  mcp-gateway: ${gatewaySecretMatch[1].trim()}`,
      );
      log(
        'ERROR',
        colors.red,
        `  mcp-john-deere: ${johnDeereSecretMatch[1].trim()}`,
      );
      log(
        'ERROR',
        colors.red,
        'Service-to-service auth will fail. Fix before continuing.',
      );
      process.exit(1);
    }
  }

  if (!existsSync(ENV_FILE)) {
    return;
  }

  const envContent = readFileSync(ENV_FILE, 'utf-8');
  const internalSecretMatch = gatewayContent.match(/INTERNAL_SECRET=(.+)/);
  const envMatch = envContent.match(/GATEWAY_INTERNAL_SECRET=(.+)/);

  if (internalSecretMatch && envMatch) {
    const devVarsSecret = internalSecretMatch[1].trim();
    const envSecret = envMatch[1].trim();
    if (devVarsSecret !== envSecret) {
      log('ERROR', colors.red, 'INTERNAL_SECRET MISMATCH!');
      log('ERROR', colors.red, `  mcp-gateway .dev.vars: ${devVarsSecret}`);
      log('ERROR', colors.red, `  dashboard .env.local: ${envSecret}`);
      log(
        'ERROR',
        colors.red,
        'Cache invalidation will fail. Fix before continuing.',
      );
      process.exit(1);
    }
  }
}

function startNextDev() {
  log('NEXT', colors.blue, 'Starting Next.js dev server...');
  return spawnWithPrefix('pnpm', ['dev'], DASHBOARD_DIR, 'NEXT', colors.blue);
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
  console.log('\n🌾 FieldMCP Development Environment\n');

  cleanWranglerCache();
  checkDockerRunning();
  const { hasStripe } = checkDependencies();
  checkSecretsMatch();

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

  const functionsProc = startSupabaseFunctions();
  const nextProc = startNextDev();
  const gatewayProc = startMcpGateway();
  const johnDeereProc = startMcpJohnDeere();

  console.log(`\n${'─'.repeat(50)}`);
  log('INFO', colors.cyan, 'All services started!');
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
