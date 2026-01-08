import { QuickStartCard } from '@/components/dashboard/quick-start-card';
import { RealtimeStats } from '@/components/dashboard/realtime-stats';
import { RealtimeUsageChart } from '@/components/dashboard/realtime-usage-chart';
import { getSubscription, getUsageCount, getUsageStats } from '@/lib/data';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [subscription, usageCount, usageStats] = await Promise.all([
    getSubscription(user!.id),
    getUsageCount(user!.id),
    getUsageStats(user!.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s an overview of your API usage.
        </p>
      </div>

      <RealtimeStats
        serverSubscription={subscription}
        serverUsageCount={usageCount}
        userId={user!.id}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <RealtimeUsageChart serverUsageLogs={usageStats} userId={user!.id} />
        <QuickStartCard />
      </div>
    </div>
  );
}
