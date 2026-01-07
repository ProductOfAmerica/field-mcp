'use client';

import { ActivityIcon, CheckCircleIcon, GaugeIcon } from 'lucide-react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { StatsCard } from './stats-card';

interface Subscription {
  id: string;
  developer_id: string;
  tier: string;
  monthly_request_limit: number;
}

interface UsageLog {
  id: string;
  request_timestamp: string;
}

interface RealtimeStatsProps {
  serverSubscription: Subscription | null;
  serverUsageCount: number;
  userId: string;
}

export function RealtimeStats({
  serverSubscription,
  serverUsageCount,
  userId,
}: RealtimeStatsProps) {
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
        .channel(`subscription-changes-${userId}`)
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
        .channel(`usage-changes-${userId}`)
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
  const limit = subscription?.monthly_request_limit ?? 1000;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <StatsCard
        title="Current Plan"
        value={tier.charAt(0).toUpperCase() + tier.slice(1)}
        description="Upgrade to increase limits"
        icon={GaugeIcon}
        iconClassName="bg-primary/10 text-primary"
      />
      <StatsCard
        title="Requests This Month"
        value={`${usageCount.toLocaleString()} / ${limit.toLocaleString()}`}
        description="Monthly API requests"
        icon={ActivityIcon}
        iconClassName="bg-primary/10 text-primary"
      />
      <StatsCard
        title="Status"
        value="Active"
        description="All systems operational"
        icon={CheckCircleIcon}
        iconClassName="bg-primary/10 text-primary"
      />
    </div>
  );
}
