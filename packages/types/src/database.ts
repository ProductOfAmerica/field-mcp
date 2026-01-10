export interface Developer {
  id: string;
  email: string;
  company_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiKey {
  id: string;
  developer_id: string;
  key_hash: string;
  key_prefix: string;
  name: string;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
}

export interface Subscription {
  id: string;
  developer_id: string;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  monthly_request_limit: number;
  created_at: string;
  updated_at: string;
}

export type SubscriptionTier = 'free' | 'developer' | 'startup' | 'enterprise';
export type SubscriptionStatus =
  | 'active'
  | 'canceled'
  | 'past_due'
  | 'trialing';

export interface FarmerConnection {
  id: string;
  developer_id: string;
  farmer_identifier: string;
  provider: string;
  provider_user_id: string | null;
  access_token_encrypted: string;
  refresh_token_encrypted: string;
  token_expires_at: string | null;
  scopes: string[] | null;
  organizations: Record<string, unknown> | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UsageLog {
  id: string;
  developer_id: string;
  api_key_id: string;
  farmer_connection_id: string | null;
  provider: string;
  tool_name: string;
  request_timestamp: string;
  response_time_ms: number | null;
  status_code: number | null;
  error_type: string | null;
}

export interface UsageAggregate {
  id: string;
  developer_id: string;
  period_start: string;
  period_end: string;
  total_requests: number;
  requests_by_provider: Record<string, number> | null;
  requests_by_tool: Record<string, number> | null;
}

export const TIER_LIMITS = {
  free: { monthly: 1000, perMinute: 60 },
  developer: { monthly: 50000, perMinute: 100 },
  startup: { monthly: 250000, perMinute: 500 },
  enterprise: { monthly: Infinity, perMinute: 1000 },
} as const satisfies Record<
  SubscriptionTier,
  { monthly: number; perMinute: number }
>;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export interface ApiKeyValidation {
  valid: boolean;
  developer?: Developer;
  subscription?: Subscription;
  keyId?: string;
}
