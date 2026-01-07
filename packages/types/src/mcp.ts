import type { Developer, Subscription, SubscriptionTier } from './database.js';

export type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

export interface McpContext {
  developerId: string;
  apiKeyId: string;
  farmerId: string;
  tier: SubscriptionTier;
}

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
