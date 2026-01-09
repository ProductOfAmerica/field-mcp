import 'server-only';
import { headers } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/service';

interface RateLimitConfig {
  maxAttempts: number;
  windowSeconds: number;
  blockSeconds: number;
}

const AUTH_RATE_LIMIT: RateLimitConfig = {
  maxAttempts: 5, // 5 failed attempts
  windowSeconds: 300, // per 5 minutes
  blockSeconds: 900, // block for 15 minutes
};

export async function checkAuthRateLimit(): Promise<{
  allowed: boolean;
  remaining: number;
}> {
  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
  const key = `dashboard:authfail:${ip}`;

  const supabase = createServiceClient();
  const { data } = await supabase
    .schema('cache')
    .from('rate_limits')
    .select('value')
    .eq('key', key)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (!data) {
    return { allowed: true, remaining: AUTH_RATE_LIMIT.maxAttempts };
  }

  const { count } = data.value as { count: number };

  if (count >= AUTH_RATE_LIMIT.maxAttempts) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: AUTH_RATE_LIMIT.maxAttempts - count };
}

export async function recordAuthFailure(): Promise<void> {
  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
  const key = `dashboard:authfail:${ip}`;

  const supabase = createServiceClient();
  const { data: existing } = await supabase
    .schema('cache')
    .from('rate_limits')
    .select('value')
    .eq('key', key)
    .single();

  const count = existing ? (existing.value as { count: number }).count + 1 : 1;
  const expiresAt = new Date(
    Date.now() + AUTH_RATE_LIMIT.blockSeconds * 1000,
  ).toISOString();

  await supabase
    .schema('cache')
    .from('rate_limits')
    .upsert(
      { key, value: { count }, expires_at: expiresAt },
      { onConflict: 'key' },
    );
}
