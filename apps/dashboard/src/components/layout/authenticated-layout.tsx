import { SidebarInset, SidebarProvider } from '@fieldmcp/ui/components/sidebar';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { Header } from '@/components/layout/header';
import { SidebarWrapper } from '@/components/layout/sidebar-wrapper';
import { createClient } from '@/lib/supabase/server';

export async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <SidebarProvider>
      <SidebarWrapper userId={user.id} />
      <SidebarInset>
        <Header user={{ email: user.email }} />
        <main className="mx-auto size-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
