'use client';

import { Progress } from '@agrimcp/ui/components/progress';
import { useSidebar } from '@agrimcp/ui/components/sidebar';
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from '@supabase/supabase-js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { createClient } from '@/lib/supabase/client';

function getMonthStart() {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0),
  );
}

interface RealtimeSidebarUsageProps {
  serverUsageCount: number;
  serverLimit: number;
  serverPlan: string;
  userId: string;
}

export function RealtimeSidebarUsage({
  serverUsageCount,
  serverLimit,
  serverPlan,
  userId,
}: RealtimeSidebarUsageProps) {
  const [usageCount, setUsageCount] = useState(serverUsageCount);
  const [limit, setLimit] = useState(serverLimit);
  const [plan, setPlan] = useState(serverPlan);
  const supabase = useMemo(() => createClient(), []);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const subscriptionChannelRef = useRef<RealtimeChannel | null>(null);
  const usageChannelRef = useRef<RealtimeChannel | null>(null);
  const { openMobile, isMobile } = useSidebar();

  const fetchUsageCount = useCallback(async () => {
    const { count } = await supabase
      .from('usage_logs')
      .select('*', { count: 'exact', head: true })
      .eq('developer_id', userId)
      .gte('request_timestamp', getMonthStart().toISOString());
    if (count !== null) {
      flushSync(() => {
        setUsageCount(count);
      });
    }
  }, [supabase, userId]);

  const fetchSubscription = useCallback(async () => {
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('tier, monthly_request_limit')
      .eq('developer_id', userId)
      .single();
    if (sub) {
      setPlan(sub.tier);
      setLimit(sub.monthly_request_limit);
    }
  }, [supabase, userId]);

  useEffect(() => {
    if (openMobile || !isMobile) {
      fetchUsageCount();
    }
  }, [isMobile, openMobile, fetchUsageCount]);

  useEffect(() => {
    let isMounted = true;

    function handleVisibility() {
      if (document.visibilityState === 'visible') {
        fetchSubscription();
        fetchUsageCount();
      }
    }

    window.addEventListener('focus', handleVisibility);
    document.addEventListener('visibilitychange', handleVisibility);

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

      const subChannel = supabase.channel(`sidebar-subscription-${userId}`).on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
          filter: `developer_id=eq.${userId}`,
        },
        (
          payload: RealtimePostgresChangesPayload<{
            tier: string;
            monthly_request_limit: number;
          }>,
        ) => {
          if (
            payload.eventType === 'UPDATE' ||
            payload.eventType === 'INSERT'
          ) {
            setPlan(payload.new.tier);
            setLimit(payload.new.monthly_request_limit);
          }
        },
      );
      subscriptionChannelRef.current = subChannel;
      subChannel.subscribe();

      const useChannel = supabase.channel(`sidebar-usage-${userId}`).on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'usage_logs',
          filter: `developer_id=eq.${userId}`,
        },
        () => {
          if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
          }
          debounceTimer.current = setTimeout(fetchUsageCount, 1000);
        },
      );
      usageChannelRef.current = useChannel;
      useChannel.subscribe();
    }

    setupRealtime();

    return () => {
      isMounted = false;
      window.removeEventListener('focus', handleVisibility);
      document.removeEventListener('visibilitychange', handleVisibility);
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
  }, [supabase, userId, fetchUsageCount, fetchSubscription]);

  const usagePercentage = (usageCount / limit) * 100;

  return (
    <div className="flex flex-col gap-3 overflow-hidden rounded-md border p-4 [[data-state=collapsed]_&]:hidden">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">API Usage</span>
        <span className="text-xs text-muted-foreground capitalize">{plan}</span>
      </div>
      <Progress value={usagePercentage} className="h-2" />
      <p className="text-xs text-muted-foreground">
        {usageCount.toLocaleString()} / {limit.toLocaleString()} requests
      </p>
    </div>
  );
}
