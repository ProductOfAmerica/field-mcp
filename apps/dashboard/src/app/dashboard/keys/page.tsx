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
import { KeyIcon } from 'lucide-react';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { TableSkeleton } from '@/components/skeletons';
import { getApiKeys } from '@/lib/data';
import { createClient } from '@/lib/supabase/server';
import { CreateKeyButton } from './create-key-button';
import { RealtimeKeysTable } from './realtime-keys-table';

async function KeysTableWrapper({ userId }: { userId: string }) {
  const keys = await getApiKeys(userId);

  return <RealtimeKeysTable serverKeys={keys ?? []} userId={userId} />;
}

export default async function KeysPage() {
  await connection();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">API Keys</h1>
          <p className="text-muted-foreground">
            Manage your API keys for authenticating requests.
          </p>
        </div>
        <CreateKeyButton />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Keys</CardTitle>
          <CardDescription>
            Your API keys are used to authenticate requests to the FieldMCP API.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<TableSkeleton columns={5} />}>
            <KeysTableWrapper userId={user!.id} />
          </Suspense>
        </CardContent>
      </Card>

      <Alert className="bg-amber-50 border-amber-200">
        <KeyIcon className="size-4 text-amber-600" />
        <AlertTitle className="text-amber-800">Security note</AlertTitle>
        <AlertDescription className="text-amber-700">
          API keys provide full access to your account. Keep them secret and
          never share them in public repositories or client-side code.
        </AlertDescription>
      </Alert>
    </div>
  );
}
