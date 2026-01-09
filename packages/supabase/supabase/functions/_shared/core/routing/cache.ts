import { getSupabaseClient } from './supabase-client.ts';

export interface CacheOptions {
  expirationTtl?: number;
}

export async function cacheGet<T>(
  table: 'rate_limits' | 'api_key_cache' | 'token_cache',
  key: string,
): Promise<T | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from(table)
    .select('value')
    .eq('key', key)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error || !data) {
    return null;
  }

  return data.value as T;
}

export async function cacheSet(
  table: 'rate_limits' | 'api_key_cache' | 'token_cache',
  key: string,
  value: unknown,
  options: CacheOptions = {},
): Promise<void> {
  const supabase = getSupabaseClient();
  const ttl = options.expirationTtl ?? 300;
  const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();

  const { error } = await supabase.from(table).upsert(
    {
      key,
      value,
      expires_at: expiresAt,
    },
    {
      onConflict: 'key',
    },
  );

  if (error) {
    console.error(`[cache] set failed for ${table}:`, error);
  }
}

export async function cacheDelete(
  table: 'rate_limits' | 'api_key_cache' | 'token_cache',
  key: string,
): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase.from(table).delete().eq('key', key);

  if (error) {
    console.error(`[cache] delete failed for ${table}:`, error);
  }
}

export async function cacheDeletePattern(
  table: 'rate_limits' | 'api_key_cache' | 'token_cache',
  pattern: string,
): Promise<number> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from(table)
    .delete()
    .like('key', pattern)
    .select('key');

  if (error) {
    console.error(`[cache] delete pattern failed for ${table}:`, error);
    return 0;
  }

  return data?.length ?? 0;
}
