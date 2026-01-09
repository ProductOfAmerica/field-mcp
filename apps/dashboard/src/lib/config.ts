import 'server-only';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getAppUrl(): string {
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return 'http://localhost:3000';
}

export const config = {
  appUrl: getAppUrl(),
  isProduction: process.env.NODE_ENV === 'production',

  supabase: {
    url: requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    anonKey: requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    serviceKey: requireEnv('SUPABASE_SERVICE_KEY'),
  },

  stripe: {
    secretKey: requireEnv('STRIPE_SECRET_KEY'),
    webhookSecret: requireEnv('STRIPE_WEBHOOK_SECRET'),
    prices: {
      developer: requireEnv('STRIPE_DEVELOPER_PRICE_ID'),
      startup: requireEnv('STRIPE_STARTUP_PRICE_ID'),
    },
  },

  johnDeere: {
    clientId: requireEnv('JOHN_DEERE_CLIENT_ID'),
    clientSecret: requireEnv('JOHN_DEERE_CLIENT_SECRET'),
    redirectUri: requireEnv('JOHN_DEERE_REDIRECT_URI'),
    authUrl:
      'https://signin.johndeere.com/oauth2/aus78tnlaysMraFhC1t7/v1/authorize',
    tokenUrl:
      'https://signin.johndeere.com/oauth2/aus78tnlaysMraFhC1t7/v1/token',
  },

  gateway: {
    get url() {
      return requireEnv('NEXT_PUBLIC_GATEWAY_URL');
    },
    get internalSecret() {
      return requireEnv('GATEWAY_INTERNAL_SECRET');
    },
  },
} as const;

export const TIER_TO_PRICE: Record<string, string> = {
  developer: config.stripe.prices.developer,
  startup: config.stripe.prices.startup,
};
