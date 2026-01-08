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
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from '@supabase/supabase-js';
import { useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
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
  const subscriptionChannelRef = useRef<RealtimeChannel | null>(null);
  const usageChannelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    setSubscription(serverSubscription);
  }, [serverSubscription]);

  useEffect(() => {
    setUsageCount(serverUsageCount);
  }, [serverUsageCount]);

  useEffect(() => {
    let isMounted = true;

    async function fetchCurrentData() {
      if (!isMounted) return;
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }
      pendingCount.current = 0;

      const { data: sub } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('developer_id', userId)
        .single();
      if (sub && isMounted) setSubscription(sub);

      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const { count } = await supabase
        .from('usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('developer_id', userId)
        .gte('request_timestamp', since.toISOString());
      if (count !== null && isMounted) setUsageCount(count);
    }

    function handleFocus() {
      fetchCurrentData();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        fetchCurrentData();
      }
    }

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    async function setupRealtime() {
      if (
        subscriptionChannelRef.current?.state === 'joined' &&
        usageChannelRef.current?.state === 'joined'
      ) {
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!isMounted) return;
      if (!session?.access_token) return;

      await supabase.realtime.setAuth(session.access_token);
      if (!isMounted) return;

      const subChannel = supabase.channel(`billing-subscription-${userId}`).on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
          filter: `developer_id=eq.${userId}`,
        },
        (payload: RealtimePostgresChangesPayload<Subscription>) => {
          if (
            payload.eventType === 'UPDATE' ||
            payload.eventType === 'INSERT'
          ) {
            setSubscription(payload.new);
          }
        },
      );
      subscriptionChannelRef.current = subChannel;
      subChannel.subscribe();

      const useChannel = supabase.channel(`billing-usage-${userId}`).on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'usage_logs',
          filter: `developer_id=eq.${userId}`,
        },
        async () => {
          pendingCount.current++;
          if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
          }
          debounceTimer.current = setTimeout(async () => {
            pendingCount.current = 0;
            const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const { count } = await supabase
              .from('usage_logs')
              .select('*', { count: 'exact', head: true })
              .eq('developer_id', userId)
              .gte('request_timestamp', since.toISOString());
            if (count !== null) {
              flushSync(() => {
                setUsageCount(count);
              });
            }
          }, 1000);
        },
      );
      usageChannelRef.current = useChannel;
      useChannel.subscribe();
    }

    setupRealtime();
    fetchCurrentData();

    return () => {
      isMounted = false;
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (subscriptionChannelRef.current) {
        supabase.removeChannel(subscriptionChannelRef.current);
        subscriptionChannelRef.current = null;
      }
      if (usageChannelRef.current) {
        supabase.removeChannel(usageChannelRef.current);
        usageChannelRef.current = null;
      }
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
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
