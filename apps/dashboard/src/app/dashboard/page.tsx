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

  const { data: usageStats } = await supabase
    .from('usage_logs')
    .select('id')
    .eq('developer_id', user?.id)
    .gte(
      'request_timestamp',
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    );

  const requestsThisMonth = usageStats?.length ?? 0;
  const subscription = developer?.subscriptions?.[0];
  const limit = subscription?.monthly_request_limit ?? 1000;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="text-sm text-gray-500 mb-1">Plan</div>
          <div className="text-2xl font-bold capitalize">
            {subscription?.tier ?? 'Free'}
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="text-sm text-gray-500 mb-1">Requests this month</div>
          <div className="text-2xl font-bold">
            {requestsThisMonth.toLocaleString()} / {limit.toLocaleString()}
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="text-sm text-gray-500 mb-1">Status</div>
          <div className="text-2xl font-bold text-green-600">Active</div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h2 className="text-lg font-semibold mb-4">Quick Start</h2>
        <div className="space-y-4 text-gray-600">
          <p>
            1. Go to <strong>API Keys</strong> and create a new key
          </p>
          <p>
            2. Go to <strong>Connections</strong> and connect a farmer&apos;s
            John Deere account
          </p>
          <p>3. Use the MCP server endpoint with your AI application:</p>
          <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto">
            POST https://mcp.agrimcp.com/v1/john-deere
          </pre>
        </div>
      </div>
    </div>
  );
}
