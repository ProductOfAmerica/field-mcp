import { getSupabaseClient } from '../supabase-client.ts';

export interface CacheOptions {
  expirationTtl?: number;
}

/** Timeout for cache operations (5 seconds) */
const CACHE_OPERATION_TIMEOUT_MS = 5_000;

/**
 * Result type for cache operations that can fail
 */
export interface CacheResult<T> {
  data: T | null;
  error: Error | null;
}

/**
 * Get a value from the cache with improved error handling
 *
 * @param table - Cache table name
 * @param key - Cache key
 * @returns Cached value or null (errors are logged but don't throw)
 */
export async function cacheGet<T>(
  table: 'rate_limits' | 'api_key_cache' | 'token_cache',
  key: string,
): Promise<T | null> {
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await Promise.race([
      supabase
        .schema('cache')
        .from(table)
        .select('value')
        .eq('key', key)
        .gt('expires_at', new Date().toISOString())
        .single(),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('Cache get timeout')),
          CACHE_OPERATION_TIMEOUT_MS,
        ),
      ),
    ]);

    if (error || !data) {
      // PGRST116 = not found, which is normal for cache misses
      if (error && error.code !== 'PGRST116') {
        console.warn(`[cache] get failed for ${table}/${key}:`, error.message);
      }
      return null;
    }

    return data.value as T;
  } catch (err) {
    console.error(`[cache] get exception for ${table}/${key}:`, err);
    return null;
  }
}

/**
 * Set a value in the cache with improved error handling
 *
 * @param table - Cache table name
 * @param key - Cache key
 * @param value - Value to cache
 * @param options - Cache options (TTL)
 * @returns true if successful, false if failed
 */
export async function cacheSet(
  table: 'rate_limits' | 'api_key_cache' | 'token_cache',
  key: string,
  value: unknown,
  options: CacheOptions = {},
): Promise<boolean> {
  const supabase = getSupabaseClient();
  const ttl = options.expirationTtl ?? 300;
  const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();

  try {
    const { error } = await Promise.race([
      supabase.schema('cache').from(table).upsert(
        {
          key,
          value,
          expires_at: expiresAt,
        },
        {
          onConflict: 'key',
        },
      ),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('Cache set timeout')),
          CACHE_OPERATION_TIMEOUT_MS,
        ),
      ),
    ]);

    if (error) {
      console.error(`[cache] set failed for ${table}/${key}:`, error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error(`[cache] set exception for ${table}/${key}:`, err);
    return false;
  }
}

/**
 * Delete a value from the cache
 *
 * @param table - Cache table name
 * @param key - Cache key
 * @returns true if successful, false if failed
 */
export async function cacheDelete(
  table: 'rate_limits' | 'api_key_cache' | 'token_cache',
  key: string,
): Promise<boolean> {
  const supabase = getSupabaseClient();

  try {
    const { error } = await Promise.race([
      supabase.schema('cache').from(table).delete().eq('key', key),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('Cache delete timeout')),
          CACHE_OPERATION_TIMEOUT_MS,
        ),
      ),
    ]);

    if (error) {
      console.error(
        `[cache] delete failed for ${table}/${key}:`,
        error.message,
      );
      return false;
    }

    return true;
  } catch (err) {
    console.error(`[cache] delete exception for ${table}/${key}:`, err);
    return false;
  }
}

/**
 * Delete all values matching a pattern from the cache
 *
 * @param table - Cache table name
 * @param pattern - Pattern to match (SQL LIKE pattern)
 * @returns Number of deleted entries
 */
export async function cacheDeletePattern(
  table: 'rate_limits' | 'api_key_cache' | 'token_cache',
  pattern: string,
): Promise<number> {
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await Promise.race([
      supabase
        .schema('cache')
        .from(table)
        .delete()
        .like('key', pattern)
        .select('key'),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('Cache delete pattern timeout')),
          CACHE_OPERATION_TIMEOUT_MS,
        ),
      ),
    ]);

    if (error) {
      console.error(
        `[cache] delete pattern failed for ${table}/${pattern}:`,
        error.message,
      );
      return 0;
    }

    return data?.length ?? 0;
  } catch (err) {
    console.error(
      `[cache] delete pattern exception for ${table}/${pattern}:`,
      err,
    );
    return 0;
  }
}
