import type { RateLimitResult, SubscriptionTier } from '@fieldmcp/types';
import { TIER_LIMITS } from '@fieldmcp/types';
import { getMinuteKey } from '../handlers/cache-invalidation.js';
import type { Env } from '../lib/types.js';

function getCurrentMinuteKey(): string {
  return getMinuteKey(new Date());
}

export async function checkAuthRateLimit(
  ip: string,
  env: Env,
): Promise<{ allowed: boolean; remaining: number }> {
  const MAX_FAILED_ATTEMPTS = 25;
  const WINDOW_SECONDS = 900;

  const kvKey = `authfail:${ip}`;
  const cached = (await env.RATE_LIMITS.get(kvKey, 'json')) as {
    count: number;
    firstAttempt: number;
  } | null;

  if (!cached) {
    return { allowed: true, remaining: MAX_FAILED_ATTEMPTS };
  }

  const now = Date.now();
  const windowExpired = now - cached.firstAttempt > WINDOW_SECONDS * 1000;

  if (windowExpired) {
    await env.RATE_LIMITS.delete(kvKey);
    return { allowed: true, remaining: MAX_FAILED_ATTEMPTS };
  }

  if (cached.count >= MAX_FAILED_ATTEMPTS) {
    console.log(`[rate_limit:auth] denied: ${ip} (${cached.count} attempts)`);
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: MAX_FAILED_ATTEMPTS - cached.count };
}

export async function recordAuthFailure(ip: string, env: Env): Promise<void> {
  const BLOCK_DURATION_SECONDS = 3600;
  const kvKey = `authfail:${ip}`;
  const cached = (await env.RATE_LIMITS.get(kvKey, 'json')) as {
    count: number;
    firstAttempt: number;
  } | null;

  const now = Date.now();
  const newData = cached
    ? { count: cached.count + 1, firstAttempt: cached.firstAttempt }
    : { count: 1, firstAttempt: now };

  await env.RATE_LIMITS.put(kvKey, JSON.stringify(newData), {
    expirationTtl: BLOCK_DURATION_SECONDS,
  });

  console.log(`[rate_limit:auth] failure: ${ip} (${newData.count} attempts)`);
}

export async function checkRateLimit(
  developerId: string,
  tier: SubscriptionTier,
  env: Env,
): Promise<RateLimitResult> {
  const limits = TIER_LIMITS[tier];
  const minuteKey = getCurrentMinuteKey();
  const kvKey = `ratelimit:${developerId}:${minuteKey}`;

  const current = (await env.RATE_LIMITS.get(kvKey, 'json')) as number | null;
  const count = current ?? 0;

  if (count >= limits.perMinute) {
    console.log(
      `[rate_limit:minute] denied: ${count}/${limits.perMinute} (${tier})`,
    );
    const now = new Date();
    const resetAt = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      now.getHours(),
      now.getMinutes() + 1,
      0,
    ).getTime();

    return { allowed: false, remaining: 0, resetAt };
  }

  await env.RATE_LIMITS.put(kvKey, JSON.stringify(count + 1), {
    expirationTtl: 120,
  });

  return { allowed: true, remaining: limits.perMinute - count - 1, resetAt: 0 };
}
