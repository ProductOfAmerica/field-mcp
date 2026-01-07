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
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Farmer Connections</h1>
        <ConnectJohnDeereButton />
      </div>

      {connections && connections.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                  Farmer ID
                </th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                  Provider
                </th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                  Connected
                </th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                  Status
                </th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {connections.map((conn) => {
                const isExpired =
                  conn.token_expires_at &&
                  new Date(conn.token_expires_at) < new Date();
                return (
                  <tr key={conn.id}>
                    <td className="px-6 py-4 text-sm font-mono">
                      {conn.farmer_identifier}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {conn.provider === 'john_deere'
                          ? 'John Deere'
                          : conn.provider}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(conn.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {isExpired ? (
                        <span className="text-amber-600">Token expired</span>
                      ) : (
                        <span className="text-green-600">Active</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DisconnectButton
                        connectionId={conn.id}
                        farmerId={conn.farmer_identifier}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
          <div className="text-gray-500 mb-4">No farmer connections yet</div>
          <p className="text-sm text-gray-400 mb-4">
            Connect a farmer&apos;s account to start accessing their data
          </p>
          <ConnectJohnDeereButton />
        </div>
      )}

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">
          Programmatic Connections
        </h3>
        <p className="text-sm text-blue-700 mb-2">
          You can also connect farmers programmatically by redirecting them to:
        </p>
        <pre className="bg-blue-100 p-3 rounded text-xs overflow-x-auto text-blue-800">
          GET /api/oauth/john-deere/authorize?farmer_id=YOUR_FARMER_ID
        </pre>
        <p className="text-sm text-blue-700 mt-2">
          The farmer will authorize access to their John Deere account and be
          redirected back to your application.
        </p>
      </div>
    </div>
  );
}
