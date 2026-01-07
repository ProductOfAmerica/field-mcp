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
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { createClient } from '@/lib/supabase/client';

const chartConfig = {
  requests: {
    label: 'Requests',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig;

interface UsageLog {
  id: string;
  request_timestamp: string;
}

interface RealtimeUsageChartProps {
  serverUsageLogs: UsageLog[];
  userId: string;
}

function buildChartData(logs: UsageLog[]) {
  const chartData = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    const dayRequests = logs.filter((log) => {
      const logDate = new Date(log.request_timestamp).toISOString().split('T')[0];
      return logDate === dateStr;
    }).length;
    chartData.push({ date: dateStr, requests: dayRequests });
  }
  return chartData;
}

export function RealtimeUsageChart({
  serverUsageLogs,
  userId,
}: RealtimeUsageChartProps) {
  const [logs, setLogs] = useState(serverUsageLogs);
  const [chartData, setChartData] = useState(() => buildChartData(serverUsageLogs));
  const supabase = useMemo(() => createClient(), []);
  const pendingLogs = useRef<UsageLog[]>([]);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLogs(serverUsageLogs);
    setChartData(buildChartData(serverUsageLogs));
  }, [serverUsageLogs]);

  useEffect(() => {
    let channel: RealtimeChannel | null = null;
    let isMounted = true;

    async function setupRealtime(accessToken: string) {
      if (!isMounted) return;

      if (channel) {
        supabase.removeChannel(channel);
      }

      await supabase.realtime.setAuth(accessToken);

      channel = supabase
        .channel(`usage-chart-${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'usage_logs',
            filter: `developer_id=eq.${userId}`,
          },
          (payload) => {
            const newLog = payload.new as UsageLog;
            pendingLogs.current.push(newLog);

            if (debounceTimer.current) {
              clearTimeout(debounceTimer.current);
            }
            debounceTimer.current = setTimeout(() => {
              setLogs((prev) => {
                const updated = [...prev, ...pendingLogs.current];
                pendingLogs.current = [];
                setChartData(buildChartData(updated));
                return updated;
              });
            }, 5000);
          },
        )
        .subscribe();
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token) {
        setupRealtime(session.access_token);
      }
    });

    return () => {
      isMounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      subscription.unsubscribe();
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
                content={<ChartTooltipContent hideLabel />}
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
