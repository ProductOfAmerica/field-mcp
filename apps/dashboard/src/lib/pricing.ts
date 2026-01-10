import { type SubscriptionTier, TIER_LIMITS } from '@fieldmcp/types';

/**
 * Pricing configuration derived from TIER_LIMITS (single source of truth)
 *
 * TIER_LIMITS is defined in @fieldmcp/types and controls:
 * - Rate limiting in the gateway
 * - Usage tracking in billing
 * - Display values here
 *
 * To change limits, update TIER_LIMITS in packages/types/src/database.ts
 */

export interface PricingTier {
  name: string;
  tier: SubscriptionTier;
  price: number | null; // null = custom pricing
  priceDisplay: string;
  description: string;
  features: string[];
  popular: boolean;
  cta: string;
  ctaVariant: 'default' | 'outline' | 'secondary';
}

/**
 * Format number with commas (e.g., 50000 -> "50,000")
 */
function formatNumber(num: number): string {
  if (num === Infinity) return 'Unlimited';
  return num.toLocaleString();
}

/**
 * All pricing tiers with metadata, derived from TIER_LIMITS
 */
export const ALL_PRICING_TIERS: PricingTier[] = [
  {
    name: 'Free',
    tier: 'free',
    price: 0,
    priceDisplay: '$0',
    description: 'Get started with basic access',
    features: [
      `${formatNumber(TIER_LIMITS.free.monthly)} requests/month`,
      `${formatNumber(TIER_LIMITS.free.perMinute)} requests/minute`,
      'John Deere integration',
      'Community support',
    ],
    popular: false,
    cta: 'Get Started',
    ctaVariant: 'outline',
  },
  {
    name: 'Developer',
    tier: 'developer',
    price: 99,
    priceDisplay: '$99',
    description: 'For individual developers and small projects',
    features: [
      `${formatNumber(TIER_LIMITS.developer.monthly)} requests/month`,
      `${formatNumber(TIER_LIMITS.developer.perMinute)} requests/minute`,
      'John Deere integration',
      'Email support',
      'Usage analytics',
    ],
    popular: false,
    cta: 'Subscribe',
    ctaVariant: 'default',
  },
  {
    name: 'Startup',
    tier: 'startup',
    price: 299,
    priceDisplay: '$299',
    description: 'For growing teams and applications',
    features: [
      `${formatNumber(TIER_LIMITS.startup.monthly)} requests/month`,
      `${formatNumber(TIER_LIMITS.startup.perMinute)} requests/minute`,
      'John Deere integration',
      'Priority support',
      'Usage analytics',
      'Multiple API keys',
    ],
    popular: true,
    cta: 'Subscribe',
    ctaVariant: 'default',
  },
  {
    name: 'Enterprise',
    tier: 'enterprise',
    price: null,
    priceDisplay: 'Custom',
    description: 'For large organizations with custom needs',
    features: [
      `${formatNumber(TIER_LIMITS.enterprise.monthly)} requests/month`,
      `${formatNumber(TIER_LIMITS.enterprise.perMinute)} requests/minute`,
      'All provider integrations',
      'Dedicated support',
      'Custom SLA',
      'On-premise option',
      'SSO & audit logs',
    ],
    popular: false,
    cta: 'Contact Sales',
    ctaVariant: 'secondary',
  },
];

/**
 * Paid tiers only (for upgrade flows)
 * Filtered to only include tiers with numeric prices
 */
export const PRICING_PLANS = ALL_PRICING_TIERS.filter(
  (
    tier,
  ): tier is PricingTier & { tier: 'developer' | 'startup'; price: number } =>
    (tier.tier === 'developer' || tier.tier === 'startup') &&
    tier.price !== null,
).map((tier) => ({
  ...tier,
  monthlyRequests: TIER_LIMITS[tier.tier].monthly,
  requestsPerMinute: TIER_LIMITS[tier.tier].perMinute,
}));

/**
 * Legacy interface for backward compatibility
 */
export interface PricingPlan {
  name: string;
  tier: 'developer' | 'startup';
  price: number;
  priceDisplay: string;
  description: string;
  features: string[];
  popular: boolean;
  monthlyRequests: number;
  requestsPerMinute: number;
}

/**
 * Get a specific tier's pricing info
 */
export function getPricingTier(
  tier: SubscriptionTier,
): PricingTier | undefined {
  return ALL_PRICING_TIERS.find((t) => t.tier === tier);
}

/**
 * Get a paid plan by tier (legacy, for upgrade flows)
 */
export function getPlanByTier(tier: string): PricingPlan | undefined {
  return PRICING_PLANS.find((plan) => plan.tier === tier) as
    | PricingPlan
    | undefined;
}

/**
 * Get limits for a tier directly from TIER_LIMITS
 */
export function getTierLimits(tier: SubscriptionTier) {
  return TIER_LIMITS[tier];
}
