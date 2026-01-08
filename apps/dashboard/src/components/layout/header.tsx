'use client';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@fieldmcp/ui/components/breadcrumb';
import { Separator } from '@fieldmcp/ui/components/separator';
import { SidebarTrigger } from '@fieldmcp/ui/components/sidebar';
import { UserNav } from './user-nav';

interface HeaderProps {
  user: {
    email?: string;
  };
  breadcrumbs?: Array<{
    label: string;
    href?: string;
  }>;
}

export function Header({ user, breadcrumbs = [] }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 before:absolute before:inset-0 before:bg-background/60 before:backdrop-blur-md before:mask-[linear-gradient(var(--card),var(--card)_80%,transparent_100%)]">
      <div className="relative z-[51] mx-auto mt-3 flex w-[calc(100%-2rem)] max-w-[calc(1280px-3rem)] items-center justify-between rounded-xl border border-border/60 bg-card px-4 py-2 shadow-md sm:w-[calc(100%-3rem)] sm:px-6">
        <div className="flex items-center gap-1.5 sm:gap-4">
          <SidebarTrigger className="[&_svg]:!size-5" />
          <Separator orientation="vertical" className="hidden h-4 sm:block" />

          {breadcrumbs.length > 0 && (
            <Breadcrumb className="hidden sm:flex">
              <BreadcrumbList>
                {breadcrumbs.map((crumb, index) => (
                  <BreadcrumbItem key={crumb.label}>
                    {index > 0 && <BreadcrumbSeparator />}
                    {crumb.href ? (
                      <BreadcrumbLink href={crumb.href}>
                        {crumb.label}
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <UserNav user={user} />
        </div>
      </div>
    </header>
  );
}
