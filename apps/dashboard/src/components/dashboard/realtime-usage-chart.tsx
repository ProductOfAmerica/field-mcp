'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@agrimcp/ui/components/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@agrimcp/ui/components/chart';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@agrimcp/ui/components/empty';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { BarChart3Icon } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import type { DailyUsage } from '@/lib/data/get-usage-stats';
import { createClient } from '@/lib/supabase/client';

const chartConfig = {
  requests: {
    label: 'Requests:',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig;

interface ChartDataPoint {
  date: string;
  requests: number;
}

interface RealtimeUsageChartProps {
  serverUsageLogs: DailyUsage[];
  userId: string;
}

function buildChartData(dailyUsage: DailyUsage[]): ChartDataPoint[] {
  const usageMap = new Map(dailyUsage.map((d) => [d.date, d.count]));

  const chartData: ChartDataPoint[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    chartData.push({
      date: dateStr,
      requests: usageMap.get(dateStr) ?? 0,
    });
  }
  return chartData;
}

export function RealtimeUsageChart({
  serverUsageLogs,
  userId,
}: RealtimeUsageChartProps) {
  const [chartData, setChartData] = useState(() =>
    buildChartData(serverUsageLogs),
  );
  const supabase = useMemo(() => createClient(), []);
  const pendingCount = useRef(0);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    setChartData(buildChartData(serverUsageLogs));
  }, [serverUsageLogs]);

  useEffect(() => {
    let isMounted = true;

    async function fetchCurrentData() {
      if (!isMounted) return;
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }
      pendingCount.current = 0;

      const { data } = await supabase.rpc('get_daily_usage', {
        p_developer_id: userId,
        p_days: 7,
      });
      if (data && isMounted) {
        setChartData(buildChartData(data as DailyUsage[]));
      }
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
      if (channelRef.current?.state === 'joined') {
        return;
      }
      if (!isMounted) return;
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      await supabase.realtime.setAuth(session.access_token);
      if (!isMounted) return;

      channelRef.current = supabase
        .channel(`usage-chart-${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'usage_logs',
            filter: `developer_id=eq.${userId}`,
          },
          () => {
            pendingCount.current += 1;

            if (debounceTimer.current) {
              clearTimeout(debounceTimer.current);
            }
            debounceTimer.current = setTimeout(() => {
              const increment = pendingCount.current;
              pendingCount.current = 0;
              const today = new Date().toISOString().split('T')[0];
              flushSync(() => {
                setChartData((prev) =>
                  prev.map((d) =>
                    d.date === today
                      ? { ...d, requests: d.requests + increment }
                      : d,
                  ),
                );
              });
            }, 1000);
          },
        )
        .subscribe();
    }

    setupRealtime();

    return () => {
      isMounted = false;
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [supabase, userId]);

  const hasData = chartData.some((d) => d.requests > 0);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>API Usage</CardTitle>
        <CardDescription>Requests over the last 7 days</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        {hasData ? (
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <BarChart data={chartData} margin={{ left: -20, bottom: -5 }}>
              <CartesianGrid vertical={false} strokeDasharray="4" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value: string) => value.slice(5)}
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel hideIndicator />}
              />
              <Bar dataKey="requests" fill="var(--color-requests)" radius={4} />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <Empty className="mb-6 border-0 p-0">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <BarChart3Icon />
                </EmptyMedia>
                <EmptyTitle>No usage data</EmptyTitle>
                <EmptyDescription>
                  Make your first API request to see usage stats here.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
