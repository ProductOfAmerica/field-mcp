import { Card, CardContent } from '@fieldmcp/ui/components/card';
import { cn } from '@fieldmcp/ui/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string;
  description?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  iconClassName?: string;
}

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  iconClassName,
}: StatsCardProps) {
  return (
    <Card className="py-4">
      <CardContent className="flex items-center gap-4">
        <div
          className={cn(
            'flex size-12 items-center justify-center rounded-lg',
            iconClassName ?? 'bg-green-100 text-green-600',
          )}
        >
          <Icon className="size-6" />
        </div>
        <div className="flex-1 space-y-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
