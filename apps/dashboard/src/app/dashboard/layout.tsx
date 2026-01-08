import { SidebarInset, SidebarProvider } from '@fieldmcp/ui/components/sidebar';
import { Skeleton } from '@fieldmcp/ui/components/skeleton';
import { Suspense } from 'react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

function LayoutSkeleton() {
  return (
    <SidebarProvider>
      <div className="flex h-full w-64 flex-col border-r bg-background p-4">
        <div className="flex items-center gap-2 pb-4">
          <Skeleton className="size-8 rounded-lg" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <div className="space-y-2 pt-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-8 w-full rounded" />
          ))}
        </div>
      </div>
      <SidebarInset>
        <div className="h-14 border-b" />
        <main className="mx-auto size-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-4 w-64" />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<LayoutSkeleton />}>
      <AuthenticatedLayout>{children}</AuthenticatedLayout>
    </Suspense>
  );
}
