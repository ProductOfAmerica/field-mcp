import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@fieldmcp/ui/components/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@fieldmcp/ui/components/card';
import { LinkIcon } from 'lucide-react';
import { Suspense } from 'react';
import { TableSkeleton } from '@/components/skeletons';
import { getConnections } from '@/lib/data';
import { createClient } from '@/lib/supabase/server';
import { ConnectJohnDeereButton } from './connect-john-deere-button';
import { RealtimeConnectionsTable } from './realtime-connections-table';

async function ConnectionsTable({ userId }: { userId: string }) {
  const connections = await getConnections(userId);

  return (
    <RealtimeConnectionsTable serverConnections={connections} userId={userId} />
  );
}

export default async function ConnectionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Farmer Connections
          </h1>
          <p className="text-muted-foreground">
            Manage OAuth connections to farmer accounts.
          </p>
        </div>
        <ConnectJohnDeereButton />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Connected Farmers</CardTitle>
          <CardDescription>
            These farmers have authorized access to their John Deere data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<TableSkeleton columns={5} />}>
            <ConnectionsTable userId={user!.id} />
          </Suspense>
        </CardContent>
      </Card>

      <Alert className="bg-blue-50 border-blue-200">
        <LinkIcon className="size-4 text-blue-600" />
        <AlertTitle className="text-blue-800">
          Programmatic Connections
        </AlertTitle>
        <AlertDescription className="text-blue-700">
          <p className="mb-2">
            You can also connect farmers programmatically by redirecting them
            to:
          </p>
          <code className="block rounded bg-blue-100 px-3 py-2 text-sm">
            GET /api/oauth/john-deere/authorize?farmer_id=YOUR_FARMER_ID
          </code>
          <p className="mt-2">
            The farmer will authorize access to their John Deere account and be
            redirected back to your application.
          </p>
        </AlertDescription>
      </Alert>
    </div>
  );
}
