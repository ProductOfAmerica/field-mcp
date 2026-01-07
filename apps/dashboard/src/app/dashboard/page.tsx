import { ActivityIcon, CheckCircleIcon, GaugeIcon } from 'lucide-react';
import { QuickStartCard } from '@/components/dashboard/quick-start-card';
import { StatsCard } from '@/components/dashboard/stats-card';
import { UsageChart } from '@/components/dashboard/usage-chart';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: developer } = await supabase
    .from('developers')
    .select('*, subscriptions(*)')
    .eq('id', user?.id)
    .single();

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const { data: usageStats } = await supabase
    .from('usage_logs')
    .select('id, request_timestamp')
    .eq('developer_id', user?.id)
    .gte('request_timestamp', thirtyDaysAgo.toISOString());

  const requestsThisMonth = usageStats?.length ?? 0;
  const subscription = developer?.subscriptions?.[0];
  const limit = subscription?.monthly_request_limit ?? 1000;

  const chartData = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    const dayRequests =
      usageStats?.filter((log) => {
        const logDate = new Date(log.request_timestamp)
          .toISOString()
          .split('T')[0];
        return logDate === dateStr;
      }).length ?? 0;
    chartData.push({ date: dateStr, requests: dayRequests });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s an overview of your API usage.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard
          title="Current Plan"
          value={subscription?.tier ?? 'Free'}
          description="Upgrade to increase limits"
          icon={GaugeIcon}
          iconClassName="bg-blue-100 text-blue-600"
        />
        <StatsCard
          title="Requests This Month"
          value={`${requestsThisMonth.toLocaleString()} / ${limit.toLocaleString()}`}
          description="Monthly API requests"
          icon={ActivityIcon}
          iconClassName="bg-purple-100 text-purple-600"
        />
        <StatsCard
          title="Status"
          value="Active"
          description="All systems operational"
          icon={CheckCircleIcon}
          iconClassName="bg-green-100 text-green-600"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <UsageChart data={chartData} />
        <QuickStartCard />
      </div>
    </div>
  );
}
