import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@fieldmcp/ui/components/card';
import { Skeleton } from '@fieldmcp/ui/components/skeleton';

const heights = [40, 65, 45, 80, 55, 70, 60];

export function UsageChartSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>API Usage</CardTitle>
        <CardDescription>Requests over the last 7 days</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex h-[200px] items-end gap-2">
          {heights.map((h) => (
            <Skeleton
              key={h}
              className="flex-1 rounded"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
