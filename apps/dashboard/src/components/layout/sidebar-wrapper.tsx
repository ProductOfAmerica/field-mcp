import { getDeveloper, getUsageCount } from '@/lib/data';
import { AppSidebar } from './app-sidebar';

interface SidebarWrapperProps {
  userId: string;
}

export async function SidebarWrapper({ userId }: SidebarWrapperProps) {
  const [developer, usageCount] = await Promise.all([
    getDeveloper(userId),
    getUsageCount(userId),
  ]);

  const subscription = developer?.subscriptions?.[0];
  const usage = {
    used: usageCount,
    limit: subscription?.monthly_request_limit ?? 1000,
  };

  return (
    <AppSidebar
      usage={usage}
      plan={subscription?.tier ?? 'free'}
      userId={userId}
    />
  );
}
