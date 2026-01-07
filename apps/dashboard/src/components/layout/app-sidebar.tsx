'use client';

import { Progress } from '@agrimcp/ui/components/progress';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@agrimcp/ui/components/sidebar';
import {
  CreditCardIcon,
  GaugeIcon,
  KeyIcon,
  LinkIcon,
  TractorIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  {
    icon: GaugeIcon,
    label: 'Overview',
    href: '/dashboard',
  },
  {
    icon: KeyIcon,
    label: 'API Keys',
    href: '/dashboard/keys',
  },
  {
    icon: LinkIcon,
    label: 'Connections',
    href: '/dashboard/connections',
  },
  {
    icon: CreditCardIcon,
    label: 'Billing',
    href: '/dashboard/billing',
  },
];

interface AppSidebarProps {
  usage?: {
    used: number;
    limit: number;
  };
  plan?: string;
}

export function AppSidebar({ usage, plan = 'Free' }: AppSidebarProps) {
  const pathname = usePathname();
  const usagePercentage = usage ? (usage.used / usage.limit) * 100 : 0;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-green-600 text-white">
                  <TractorIcon className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">AgriMCP</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Developer Platform
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.label}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gap-4 p-3 transition-[padding] duration-200 [[data-state=collapsed]_&]:p-2">
        {usage && (
          <div className="flex flex-col gap-3 overflow-hidden rounded-md border p-4 [[data-state=collapsed]_&]:hidden">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">API Usage</span>
              <span className="text-xs text-muted-foreground capitalize">
                {plan}
              </span>
            </div>
            <Progress value={usagePercentage} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {usage.used.toLocaleString()} / {usage.limit.toLocaleString()}{' '}
              requests
            </p>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
