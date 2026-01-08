import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@fieldmcp/ui/components/card';
import { Skeleton } from '@fieldmcp/ui/components/skeleton';

export function BillingSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Current Plan
              <Skeleton className="h-5 w-16" />
            </CardTitle>
            <CardDescription>
              <Skeleton className="mt-1 h-4 w-32" />
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-2 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}
