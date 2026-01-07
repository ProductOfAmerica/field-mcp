import { SidebarInset, SidebarProvider } from '@agrimcp/ui/components/sidebar';
import { redirect } from 'next/navigation';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { Header } from '@/components/layout/header';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: developer } = await supabase
    .from('developers')
    .select('*, subscriptions(*)')
    .eq('id', user.id)
    .single();

  const { data: usageStats } = await supabase
    .from('usage_logs')
    .select('id')
    .eq('developer_id', user.id)
    .gte(
      'request_timestamp',
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    );

  const subscription = developer?.subscriptions?.[0];
  const usage = {
    used: usageStats?.length ?? 0,
    limit: subscription?.monthly_request_limit ?? 1000,
  };

  return (
    <SidebarProvider>
      <AppSidebar usage={usage} plan={subscription?.tier ?? 'Free'} />
      <SidebarInset>
        <Header user={{ email: user.email }} />
        <main className="mx-auto size-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
