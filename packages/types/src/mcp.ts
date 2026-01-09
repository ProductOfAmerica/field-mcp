import type { SubscriptionTier } from './database.js';

export type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
export type { ApiKeyValidation, RateLimitResult } from './database.js';

export interface McpContext {
  developerId: string;
  apiKeyId: string;
  farmerId: string;
  tier: SubscriptionTier;
}
