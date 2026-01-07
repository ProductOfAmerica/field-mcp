import Link from 'next/link';
import { redirect } from 'next/navigation';
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

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="text-xl font-bold text-green-700">
            AgriMCP
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="text-gray-600 hover:text-gray-900"
            >
              Overview
            </Link>
            <Link
              href="/dashboard/keys"
              className="text-gray-600 hover:text-gray-900"
            >
              API Keys
            </Link>
            <Link
              href="/dashboard/connections"
              className="text-gray-600 hover:text-gray-900"
            >
              Connections
            </Link>
            <Link
              href="/dashboard/billing"
              className="text-gray-600 hover:text-gray-900"
            >
              Billing
            </Link>
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="text-gray-600 hover:text-gray-900"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
