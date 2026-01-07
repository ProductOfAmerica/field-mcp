import { execSync, spawn } from 'node:child_process';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const __dirname = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(__dirname, '..', '..');
export const SUPABASE_DIR = join(ROOT, 'packages', 'supabase');
export const DASHBOARD_DIR = join(ROOT, 'apps', 'dashboard');
export const GATEWAY_DIR = join(ROOT, 'packages', 'mcp-gateway');
export const JOHN_DEERE_DIR = join(ROOT, 'packages', 'mcp-john-deere');
export const ENV_FILE = join(DASHBOARD_DIR, '.env.local');

export const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

export function log(prefix, color, message) {
  console.log(`${color}[${prefix}]${colors.reset} ${message}`);
}

export function checkDockerRunning() {
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

export function checkDependencies() {
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

export async function startSupabase() {
  log('SUPABASE', colors.green, 'Starting Supabase...');

  try {
    execSync('supabase stop --no-backup', { cwd: SUPABASE_DIR, stdio: 'pipe' });
  } catch {}

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
  } catch {}

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
      resolve(parseSupabaseOutput(output));
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

export async function startStripeWebhook() {
  log('STRIPE', colors.magenta, 'Starting Stripe webhook listener...');

  return new Promise((resolve) => {
    const proc = spawn(
      'stripe',
      ['listen', '--forward-to', 'localhost:3000/api/webhooks/stripe'],
      { shell: true, stdio: 'pipe' },
    );

    let webhookSecret = null;

    const handleOutput = (data, isStderr = false) => {
      const output = data.toString();
      const stream = isStderr ? process.stderr : process.stdout;
      stream.write(`${colors.magenta}[STRIPE]${colors.reset} ${output}`);

      const match = output.match(/whsec_[a-zA-Z0-9]+/);
      if (match && !webhookSecret) {
        webhookSecret = match[0];
        log('STRIPE', colors.magenta, `Webhook secret: ${webhookSecret}`);
        resolve({ proc, webhookSecret });
      }
    };

    proc.stdout.on('data', (data) => handleOutput(data));
    proc.stderr.on('data', (data) => handleOutput(data, true));

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

export function updateEnvFile(supabaseCreds, stripeWebhookSecret) {
  let envContent = existsSync(ENV_FILE) ? readFileSync(ENV_FILE, 'utf-8') : '';

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

export function startSupabaseFunctions() {
  log('FUNCTIONS', colors.yellow, 'Starting Supabase Edge Functions...');
  return spawnWithPrefix(
    'supabase',
    ['functions', 'serve'],
    SUPABASE_DIR,
    'FUNCTIONS',
    colors.yellow,
  );
}

export function spawnWithPrefix(command, args, cwd, prefix, color) {
  const proc = spawn(command, args, { cwd, shell: true, stdio: 'pipe' });

  proc.stdout.on('data', (data) => {
    process.stdout.write(`${color}[${prefix}]${colors.reset} ${data}`);
  });

  proc.stderr.on('data', (data) => {
    process.stderr.write(`${color}[${prefix}]${colors.reset} ${data}`);
  });

  return proc;
}

export function setupCleanup(processes, stopSupabase = true) {
  const cleanup = () => {
    log('INFO', colors.yellow, '\nShutting down...');
    for (const proc of processes) {
      proc?.kill();
    }

    if (stopSupabase) {
      log('INFO', colors.yellow, 'Stopping Supabase...');
      try {
        execSync('supabase stop', { cwd: SUPABASE_DIR, stdio: 'inherit' });
      } catch {}
    }

    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

export function cleanWranglerCache() {
  const wranglerDirs = [
    join(GATEWAY_DIR, '.wrangler'),
    join(JOHN_DEERE_DIR, '.wrangler'),
  ];

  for (const dir of wranglerDirs) {
    if (existsSync(dir)) {
      rmSync(dir, { recursive: true, force: true });
      log('CLEANUP', colors.yellow, `Deleted ${dir}`);
    }
  }
}
