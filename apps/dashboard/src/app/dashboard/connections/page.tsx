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
import { LinkIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ConnectJohnDeereButton } from './connect-john-deere-button';
import { DisconnectButton } from './disconnect-button';

export default async function ConnectionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: connections } = await supabase
    .from('farmer_connections')
    .select('*')
    .eq('developer_id', user?.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

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
          {connections && connections.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Farmer ID</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Connected</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {connections.map((conn) => {
                  const isExpired =
                    conn.token_expires_at &&
                    new Date(conn.token_expires_at) < new Date();
                  return (
                    <TableRow key={conn.id}>
                      <TableCell className="font-mono">
                        {conn.farmer_identifier}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-800"
                        >
                          {conn.provider === 'john_deere'
                            ? 'John Deere'
                            : conn.provider}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(conn.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {isExpired ? (
                          <Badge
                            variant="outline"
                            className="text-amber-600 border-amber-300"
                          >
                            Token expired
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-green-600 border-green-300"
                          >
                            Active
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DisconnectButton
                          connectionId={conn.id}
                          farmerId={conn.farmer_identifier}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <LinkIcon className="size-6 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">
                No farmer connections yet
              </h3>
              <p className="mb-4 mt-2 text-sm text-muted-foreground">
                Connect a farmer&apos;s account to start accessing their data
              </p>
              <ConnectJohnDeereButton />
            </div>
          )}
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
