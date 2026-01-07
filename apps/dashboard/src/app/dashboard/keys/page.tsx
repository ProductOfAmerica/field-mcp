import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@agrimcp/ui/components/alert';
import { Badge } from '@agrimcp/ui/components/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@agrimcp/ui/components/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@agrimcp/ui/components/table';
import { KeyIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { CreateKeyButton } from './create-key-button';
import { DeleteKeyButton } from './delete-key-button';

export default async function KeysPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: keys } = await supabase
    .from('api_keys')
    .select('*')
    .eq('developer_id', user?.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

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
            Your API keys are used to authenticate requests to the AgriMCP API.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {keys && keys.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium">
                      {key.name || 'Unnamed key'}
                    </TableCell>
                    <TableCell>
                      <code className="rounded bg-muted px-2 py-1 text-sm">
                        {key.key_prefix}...
                      </code>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(key.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {key.last_used_at ? (
                        new Date(key.last_used_at).toLocaleDateString()
                      ) : (
                        <Badge variant="outline">Never</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DeleteKeyButton keyId={key.id} keyName={key.name} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <KeyIcon className="size-6 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">No API keys yet</h3>
              <p className="mb-4 mt-2 text-sm text-muted-foreground">
                Create your first API key to start using the AgriMCP API
              </p>
              <CreateKeyButton />
            </div>
          )}
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
