import 'server-only';
import Stripe from 'stripe';
import { config } from './config';

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    stripeInstance = new Stripe(config.stripe.secretKey, {
      apiVersion: '2025-12-15.clover',
    });
  }
  return stripeInstance;
}

export { TIER_TO_PRICE } from './config';
