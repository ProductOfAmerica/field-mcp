'use client';

import { Progress } from '@agrimcp/ui/components/progress';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

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
  const pendingCount = useRef(0);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const channelsRef = useRef<RealtimeChannel[]>([]);

  useEffect(() => {
    setUsageCount(serverUsageCount);
  }, [serverUsageCount]);

  useEffect(() => {
    setLimit(serverLimit);
  }, [serverLimit]);

  useEffect(() => {
    setPlan(serverPlan);
  }, [serverPlan]);

  useEffect(() => {
    let isMounted = true;

    async function setupRealtime() {
      if (!isMounted) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      await supabase.realtime.setAuth(session.access_token);
      if (!isMounted) return;

      const subscriptionChannel = supabase
        .channel(`sidebar-subscription-${userId}-${Date.now()}`)
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
              const sub = payload.new as { tier: string; monthly_request_limit: number };
              setPlan(sub.tier);
              setLimit(sub.monthly_request_limit);
            }
          },
        )
        .subscribe();

      const usageChannel = supabase
        .channel(`sidebar-usage-${userId}-${Date.now()}`)
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
            }, 2000);
          },
        )
        .subscribe();

      channelsRef.current = [subscriptionChannel, usageChannel];
    }

    setupRealtime();

    return () => {
      isMounted = false;
      for (const channel of channelsRef.current) {
        supabase.removeChannel(channel);
      }
      channelsRef.current = [];
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [supabase, userId]);

  const usagePercentage = (usageCount / limit) * 100;

  return (
    <div className="flex flex-col gap-3 overflow-hidden rounded-md border p-4 [[data-state=collapsed]_&]:hidden">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">API Usage</span>
        <span className="text-xs text-muted-foreground capitalize">
          {plan}
        </span>
      </div>
      <Progress value={usagePercentage} className="h-2" />
      <p className="text-xs text-muted-foreground">
        {usageCount.toLocaleString()} / {limit.toLocaleString()} requests
      </p>
    </div>
  );
}
