import type { ApiKeyValidation } from '@agrimcp/types';
import { createClient } from '@supabase/supabase-js';
import { API_KEY_CACHE_TTL } from '../lib/constants.js';
import type { Env } from '../lib/types.js';

async function sha256(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function addTimingNoise(): Promise<void> {
  const delay = Math.random() * 50;
  await new Promise((resolve) => setTimeout(resolve, delay));
}

export async function validateApiKey(
  apiKey: string | null,
  env: Env,
): Promise<ApiKeyValidation> {
  if (!apiKey || !apiKey.startsWith('agri_live_') || apiKey.length < 20) {
    await addTimingNoise();
    return { valid: false };
  }

  const keyHash = await sha256(apiKey);
  const keyPrefix = apiKey.slice(0, 15);

  const cached = await env.API_KEY_CACHE.get(`key:${keyPrefix}`, 'json');
  if (cached) {
    return cached as ApiKeyValidation;
  }

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

  const { data: keyData, error: keyError } = await supabase
    .from('api_keys')
    .select(
      `
      id,
      developer_id,
      is_active,
      developers!inner (
        id,
        email,
        company_name,
        subscriptions (
          id,
          tier,
          status,
          monthly_request_limit,
          current_period_start,
          current_period_end
        )
      )
    `,
    )
    .eq('key_hash', keyHash)
    .eq('is_active', true)
    .single();

  if (keyError || !keyData) {
    await addTimingNoise();
    return { valid: false };
  }

  const developer = keyData.developers as unknown as {
    id: string;
    email: string;
    company_name: string | null;
    subscriptions: Array<{
      id: string;
      tier: string;
      status: string;
      monthly_request_limit: number;
      current_period_start: string | null;
      current_period_end: string | null;
    }>;
  };

  const subscription = developer.subscriptions?.[0];

  const result: ApiKeyValidation = {
    valid: true,
    developer: {
      id: developer.id,
      email: developer.email,
      company_name: developer.company_name,
      created_at: '',
      updated_at: '',
    },
    subscription: subscription
      ? {
          id: subscription.id,
          developer_id: developer.id,
          stripe_subscription_id: null,
          stripe_customer_id: null,
          tier: subscription.tier as
            | 'free'
            | 'developer'
            | 'startup'
            | 'enterprise',
          status: subscription.status as
            | 'active'
            | 'canceled'
            | 'past_due'
            | 'trialing',
          monthly_request_limit: subscription.monthly_request_limit,
          current_period_start: subscription.current_period_start,
          current_period_end: subscription.current_period_end,
          created_at: '',
          updated_at: '',
        }
      : undefined,
    keyId: keyData.id,
  };

  await env.API_KEY_CACHE.put(`key:${keyPrefix}`, JSON.stringify(result), {
    expirationTtl: API_KEY_CACHE_TTL,
  });

  return result;
}

export function extractApiKey(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return null;
}
