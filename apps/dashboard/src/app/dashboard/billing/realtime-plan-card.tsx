'use client';

import { Badge } from '@agrimcp/ui/components/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@agrimcp/ui/components/card';
import { Progress } from '@agrimcp/ui/components/progress';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ManageButton } from './manage-button';

interface Subscription {
  id: string;
  developer_id: string;
  tier: string;
  status: string;
  monthly_request_limit: number;
  cancel_at_period_end: boolean;
  current_period_end: string | null;
}

interface RealtimePlanCardProps {
  serverSubscription: Subscription | null;
  serverUsageCount: number;
  userId: string;
}

export function RealtimePlanCard({
  serverSubscription,
  serverUsageCount,
  userId,
}: RealtimePlanCardProps) {
  const [subscription, setSubscription] = useState(serverSubscription);
  const [usageCount, setUsageCount] = useState(serverUsageCount);
  const supabase = useMemo(() => createClient(), []);
  const pendingCount = useRef(0);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setSubscription(serverSubscription);
  }, [serverSubscription]);

  useEffect(() => {
    setUsageCount(serverUsageCount);
  }, [serverUsageCount]);

  useEffect(() => {
    let subscriptionChannel: RealtimeChannel | null = null;
    let usageChannel: RealtimeChannel | null = null;
    let isMounted = true;

    async function setupRealtime(accessToken: string) {
      if (!isMounted) return;

      if (subscriptionChannel) {
        supabase.removeChannel(subscriptionChannel);
      }
      if (usageChannel) {
        supabase.removeChannel(usageChannel);
      }

      await supabase.realtime.setAuth(accessToken);

      subscriptionChannel = supabase
        .channel(`billing-subscription-${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'subscriptions',
            filter: `developer_id=eq.${userId}`,
          },
          (payload) => {
            if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
              setSubscription(payload.new as Subscription);
            }
          },
        )
        .subscribe();

      usageChannel = supabase
        .channel(`billing-usage-${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'usage_logs',
            filter: `developer_id=eq.${userId}`,
          },
          () => {
            pendingCount.current++;
            if (debounceTimer.current) {
              clearTimeout(debounceTimer.current);
            }
            debounceTimer.current = setTimeout(() => {
              setUsageCount((prev) => prev + pendingCount.current);
              pendingCount.current = 0;
            }, 5000);
          },
        )
        .subscribe();
    }

    const {
      data: { subscription: authSubscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token) {
        setupRealtime(session.access_token);
      }
    });

    return () => {
      isMounted = false;
      if (subscriptionChannel) {
        supabase.removeChannel(subscriptionChannel);
      }
      if (usageChannel) {
        supabase.removeChannel(usageChannel);
      }
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      authSubscription.unsubscribe();
    };
  }, [supabase, userId]);

  const tier = subscription?.tier ?? 'free';
  const isPaid = tier !== 'free';
  const isCanceling = subscription?.cancel_at_period_end;
  const requestsLimit = subscription?.monthly_request_limit ?? 1000;
  const usagePercentage = Math.min((usageCount / requestsLimit) * 100, 100);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Current Plan
              <Badge variant="secondary" className="capitalize">
                {tier}
              </Badge>
              {isCanceling && (
                <Badge
                  variant="outline"
                  className="text-amber-600 border-amber-300"
                >
                  Cancels at period end
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {requestsLimit.toLocaleString()} requests/month
            </CardDescription>
          </div>
          {isPaid && <ManageButton />}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Monthly usage</span>
            <span className="font-medium">
              {usageCount.toLocaleString()} / {requestsLimit.toLocaleString()}
            </span>
          </div>
          <Progress value={usagePercentage} className="h-2" />
        </div>
        {isCanceling && subscription?.current_period_end && (
          <p className="text-sm text-amber-600">
            Your access will continue until{' '}
            {new Date(subscription.current_period_end).toLocaleDateString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
