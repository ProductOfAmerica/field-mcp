#!/usr/bin/env node

import { execSync, spawn } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SUPABASE_DIR = join(ROOT, 'packages', 'supabase');
const DASHBOARD_DIR = join(ROOT, 'apps', 'dashboard');
const ENV_FILE = join(DASHBOARD_DIR, '.env.local');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(prefix, color, message) {
  console.log(`${color}[${prefix}]${colors.reset} ${message}`);
}

function checkDependencies() {
  try {
    execSync('supabase --version', { stdio: 'pipe' });
  } catch {
    log(
      'ERROR',
      colors.red,
      'Supabase CLI not installed. Run: npm install -g supabase',
    );
    process.exit(1);
  }

  try {
    execSync('stripe --version', { stdio: 'pipe' });
  } catch {
    log(
      'WARN',
      colors.yellow,
      'Stripe CLI not installed. Stripe webhooks will be skipped.',
    );
    log('WARN', colors.yellow, 'Install with: winget install Stripe.StripeCLI');
    return { hasStripe: false };
  }

  return { hasStripe: true };
}

function checkDockerRunning() {
  try {
    execSync('docker info', { stdio: 'pipe' });
    return true;
  } catch {
    log(
      'ERROR',
      colors.red,
      'Docker is not running. Please start Docker Desktop.',
    );
    process.exit(1);
  }
}

async function startSupabase() {
  log('SUPABASE', colors.green, 'Starting Supabase...');

  // Stop any existing containers first to avoid conflicts
  try {
    execSync('supabase stop --no-backup', {
      cwd: SUPABASE_DIR,
      stdio: 'pipe',
    });
  } catch {
    // Ignore errors if nothing is running
  }

  // Force remove any orphaned containers (Windows-compatible)
  try {
    const containers = execSync('docker ps -aq --filter "name=supabase_"', {
      encoding: 'utf-8',
      stdio: 'pipe',
    }).trim();
    if (containers) {
      for (const id of containers.split('\n').filter(Boolean)) {
        try {
          execSync(`docker rm -f ${id}`, { stdio: 'pipe' });
        } catch {}
      }
    }
  } catch {
    // Ignore if no containers to remove
  }

  return new Promise((resolve, reject) => {
    const proc = spawn('supabase', ['start'], {
      cwd: SUPABASE_DIR,
      shell: true,
      stdio: 'pipe',
    });

    let output = '';

    proc.stdout.on('data', (data) => {
      output += data.toString();
      process.stdout.write(`${colors.green}[SUPABASE]${colors.reset} ${data}`);
    });

    proc.stderr.on('data', (data) => {
      output += data.toString();
      process.stderr.write(`${colors.green}[SUPABASE]${colors.reset} ${data}`);
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Supabase start failed with code ${code}`));
        return;
      }

      const credentials = parseSupabaseOutput(output);
      resolve(credentials);
    });
  });
}

function parseSupabaseOutput(output) {
  const lines = output.split('\n');
  const creds = {};

  for (const line of lines) {
    if (line.includes('API URL:')) {
      creds.apiUrl = line.split('API URL:')[1].trim();
    } else if (line.includes('anon key:')) {
      creds.anonKey = line.split('anon key:')[1].trim();
    } else if (line.includes('service_role key:')) {
      creds.serviceRoleKey = line.split('service_role key:')[1].trim();
    } else if (line.includes('Studio URL:')) {
      creds.studioUrl = line.split('Studio URL:')[1].trim();
    }
  }

  return creds;
}

async function startStripeWebhook() {
  log('STRIPE', colors.magenta, 'Starting Stripe webhook listener...');

  return new Promise((resolve) => {
    const proc = spawn(
      'stripe',
      ['listen', '--forward-to', 'localhost:3000/api/webhooks/stripe'],
      {
        shell: true,
        stdio: 'pipe',
      },
    );

    let webhookSecret = null;

    proc.stdout.on('data', (data) => {
      const output = data.toString();
      process.stdout.write(
        `${colors.magenta}[STRIPE]${colors.reset} ${output}`,
      );

      const match = output.match(/whsec_[a-zA-Z0-9]+/);
      if (match && !webhookSecret) {
        webhookSecret = match[0];
        log('STRIPE', colors.magenta, `Webhook secret: ${webhookSecret}`);
        resolve({ proc, webhookSecret });
      }
    });

    proc.stderr.on('data', (data) => {
      const output = data.toString();
      process.stderr.write(
        `${colors.magenta}[STRIPE]${colors.reset} ${output}`,
      );

      const match = output.match(/whsec_[a-zA-Z0-9]+/);
      if (match && !webhookSecret) {
        webhookSecret = match[0];
        log('STRIPE', colors.magenta, `Webhook secret: ${webhookSecret}`);
        resolve({ proc, webhookSecret });
      }
    });

    proc.on('error', (err) => {
      log('STRIPE', colors.red, `Failed to start: ${err.message}`);
      resolve({ proc: null, webhookSecret: null });
    });

    setTimeout(() => {
      if (!webhookSecret) {
        log('STRIPE', colors.yellow, 'Timeout waiting for webhook secret');
        resolve({ proc, webhookSecret: null });
      }
    }, 10000);
  });
}

function updateEnvFile(supabaseCreds, stripeWebhookSecret) {
  let envContent = '';

  if (existsSync(ENV_FILE)) {
    envContent = readFileSync(ENV_FILE, 'utf-8');
  }

  const updates = {
    NEXT_PUBLIC_SUPABASE_URL: supabaseCreds.apiUrl || 'http://127.0.0.1:54321',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseCreds.anonKey,
    SUPABASE_SERVICE_KEY: supabaseCreds.serviceRoleKey,
  };

  if (stripeWebhookSecret) {
    updates.STRIPE_WEBHOOK_SECRET = stripeWebhookSecret;
  }

  for (const [key, value] of Object.entries(updates)) {
    if (!value) continue;

    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      envContent += `\n${key}=${value}`;
    }
  }

  envContent = `${envContent.trim()}\n`;
  writeFileSync(ENV_FILE, envContent);
  log('ENV', colors.cyan, `Updated ${ENV_FILE}`);
}

function startNextDev() {
  log('NEXT', colors.blue, 'Starting Next.js dev server...');

  const proc = spawn('pnpm', ['dev'], {
    cwd: DASHBOARD_DIR,
    shell: true,
    stdio: 'pipe',
  });

  proc.stdout.on('data', (data) => {
    process.stdout.write(`${colors.blue}[NEXT]${colors.reset} ${data}`);
  });

  proc.stderr.on('data', (data) => {
    process.stderr.write(`${colors.blue}[NEXT]${colors.reset} ${data}`);
  });

  return proc;
}

function startMcpGateway() {
  log('GATEWAY', colors.cyan, 'Starting MCP Gateway on port 8787...');

  const proc = spawn('pnpm', ['dev', '--port', '8787'], {
    cwd: join(ROOT, 'packages', 'mcp-gateway'),
    shell: true,
    stdio: 'pipe',
  });

  proc.stdout.on('data', (data) => {
    process.stdout.write(`${colors.cyan}[GATEWAY]${colors.reset} ${data}`);
  });

  proc.stderr.on('data', (data) => {
    process.stderr.write(`${colors.cyan}[GATEWAY]${colors.reset} ${data}`);
  });

  return proc;
}

function startMcpJohnDeere() {
  log('JOHN-DEERE', colors.green, 'Starting John Deere MCP on port 8788...');

  const proc = spawn('pnpm', ['dev', '--port', '8788'], {
    cwd: join(ROOT, 'packages', 'mcp-john-deere'),
    shell: true,
    stdio: 'pipe',
  });

  proc.stdout.on('data', (data) => {
    process.stdout.write(`${colors.green}[JOHN-DEERE]${colors.reset} ${data}`);
  });

  proc.stderr.on('data', (data) => {
    process.stderr.write(`${colors.green}[JOHN-DEERE]${colors.reset} ${data}`);
  });

  return proc;
}

function startSupabaseFunctions() {
  log('FUNCTIONS', colors.yellow, 'Starting Supabase Edge Functions...');

  const proc = spawn('supabase', ['functions', 'serve'], {
    cwd: SUPABASE_DIR,
    shell: true,
    stdio: 'pipe',
  });

  proc.stdout.on('data', (data) => {
    process.stdout.write(`${colors.yellow}[FUNCTIONS]${colors.reset} ${data}`);
  });

  proc.stderr.on('data', (data) => {
    process.stderr.write(`${colors.yellow}[FUNCTIONS]${colors.reset} ${data}`);
  });

  return proc;
}

async function main() {
  console.log('\n🌾 AgriMCP Development Environment\n');

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

  const cleanup = () => {
    log('INFO', colors.yellow, '\nShutting down...');
    nextProc?.kill();
    functionsProc?.kill();
    stripeProc?.kill();
    gatewayProc?.kill();
    johnDeereProc?.kill();

    log('INFO', colors.yellow, 'Stopping Supabase...');
    try {
      execSync('supabase stop', { cwd: SUPABASE_DIR, stdio: 'inherit' });
    } catch {}

    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

main().catch((err) => {
  log('ERROR', colors.red, err.message);
  process.exit(1);
});
