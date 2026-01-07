export interface BaseEnv {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  RATE_LIMITS: KVNamespace;
  API_KEY_CACHE: KVNamespace;
  JOHN_DEERE_MCP: Fetcher;
  ENVIRONMENT: string;
  GATEWAY_SECRET: string;
  INTERNAL_SECRET: string;
}

export type Env = BaseEnv;
