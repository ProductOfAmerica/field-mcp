import { cacheDelete, cacheGet, cacheSet } from './cache.ts';

const TIER_LIMITS: Record<string, { perMinute: number; perMonth: number }> = {
  free: { perMinute: 10, perMonth: 1000 },
  developer: { perMinute: 100, perMonth: 10000 },
  startup: { perMinute: 500, perMonth: 100000 },
  enterprise: { perMinute: 2000, perMonth: 1000000 },
};

function getCurrentMinuteKey(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}-${now.getUTCHours()}-${now.getUTCMinutes()}`;
}

export function getMinuteKey(date: Date): string {
  return `${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()}-${date.getUTCHours()}-${date.getUTCMinutes()}`;
}

export async function checkAuthRateLimit(
  ip: string,
): Promise<{ allowed: boolean; remaining: number }> {
  const MAX_FAILED_ATTEMPTS = 25;
  const WINDOW_SECONDS = 900;

  const kvKey = `authfail:${ip}`;
  const cached = await cacheGet<{ count: number; firstAttempt: number }>(
    'rate_limits',
    kvKey,
  );

  if (!cached) {
    return { allowed: true, remaining: MAX_FAILED_ATTEMPTS };
  }

  const now = Date.now();
  const windowExpired = now - cached.firstAttempt > WINDOW_SECONDS * 1000;

  if (windowExpired) {
    await cacheDelete('rate_limits', kvKey);
    return { allowed: true, remaining: MAX_FAILED_ATTEMPTS };
  }

  if (cached.count >= MAX_FAILED_ATTEMPTS) {
    console.log(`[rate_limit:auth] denied: ${ip} (${cached.count} attempts)`);
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: MAX_FAILED_ATTEMPTS - cached.count };
}

export async function recordAuthFailure(ip: string): Promise<void> {
  const BLOCK_DURATION_SECONDS = 3600;
  const kvKey = `authfail:${ip}`;
  const cached = await cacheGet<{ count: number; firstAttempt: number }>(
    'rate_limits',
    kvKey,
  );

  const now = Date.now();
  const newData = cached
    ? { count: cached.count + 1, firstAttempt: cached.firstAttempt }
    : { count: 1, firstAttempt: now };

  await cacheSet('rate_limits', kvKey, newData, {
    expirationTtl: BLOCK_DURATION_SECONDS,
  });

  console.log(`[rate_limit:auth] failure: ${ip} (${newData.count} attempts)`);
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export async function checkRateLimit(
  developerId: string,
  tier: string,
): Promise<RateLimitResult> {
  const limits = TIER_LIMITS[tier] ?? TIER_LIMITS.free;
  const minuteKey = getCurrentMinuteKey();
  const kvKey = `ratelimit:${developerId}:${minuteKey}`;

  const current = await cacheGet<number>('rate_limits', kvKey);
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

  await cacheSet('rate_limits', kvKey, count + 1, {
    expirationTtl: 120,
  });

  return { allowed: true, remaining: limits.perMinute - count - 1, resetAt: 0 };
}
