import { type SubscriptionTier, TIER_LIMITS } from '@fieldmcp/types';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { config } from '@/lib/config';
import { getStripe } from '@/lib/stripe';
import { createServiceClient } from '@/lib/supabase/service';

const checkoutMetadataSchema = z.object({
  developer_id: z.string().uuid(),
  tier: z.enum(['free', 'developer', 'startup', 'enterprise']),
});

async function invalidateGatewayCache(developerId: string): Promise<void> {
  if (!config.gateway.internalSecret) return;

  try {
    await fetch(`${config.gateway.url}/mcp-gateway/internal/invalidate-cache`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Secret': config.gateway.internalSecret,
      },
      body: JSON.stringify({ developerId }),
    });
  } catch (err) {
    console.error('Failed to invalidate gateway cache:', err);
  }
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  const stripe = getStripe();
  const supabaseAdmin = createServiceClient();

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      config.stripe.webhookSecret,
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const parsed = checkoutMetadataSchema.safeParse(session.metadata);

      if (parsed.success) {
        const { developer_id: developerId, tier } = parsed.data;
        await supabaseAdmin
          .from('subscriptions')
          .update({
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            tier,
            status: 'active',
            monthly_request_limit:
              TIER_LIMITS[tier as SubscriptionTier]?.monthly ?? 1000,
          })
          .eq('developer_id', developerId);
        await invalidateGatewayCache(developerId);
      } else {
        console.error('Invalid checkout metadata:', parsed.error.flatten());
      }
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object;
      const status = subscription.status === 'active' ? 'active' : 'past_due';
      const cancelAtPeriodEnd = (
        subscription as unknown as { cancel_at_period_end: boolean }
      ).cancel_at_period_end;
      const periodStart = (
        subscription as unknown as { current_period_start: number }
      ).current_period_start;
      const periodEnd = (
        subscription as unknown as { current_period_end: number }
      ).current_period_end;

      const updateData: Record<string, unknown> = {
        status,
        cancel_at_period_end: cancelAtPeriodEnd,
      };

      if (periodStart) {
        updateData.current_period_start = new Date(
          periodStart * 1000,
        ).toISOString();
      }
      if (periodEnd) {
        updateData.current_period_end = new Date(
          periodEnd * 1000,
        ).toISOString();
      }

      const { data: updatedSub } = await supabaseAdmin
        .from('subscriptions')
        .update(updateData)
        .eq('stripe_subscription_id', subscription.id)
        .select('developer_id')
        .single();
      if (updatedSub) {
        await invalidateGatewayCache(updatedSub.developer_id);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object;

      const { data: deletedSub } = await supabaseAdmin
        .from('subscriptions')
        .update({
          tier: 'free',
          status: 'canceled',
          monthly_request_limit: 1000,
        })
        .eq('stripe_subscription_id', subscription.id)
        .select('developer_id')
        .single();
      if (deletedSub) {
        await invalidateGatewayCache(deletedSub.developer_id);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
