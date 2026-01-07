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
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">API Keys</h1>
        <CreateKeyButton />
      </div>

      {keys && keys.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                  Name
                </th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                  Key
                </th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                  Created
                </th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                  Last Used
                </th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {keys.map((key) => (
                <tr key={key.id}>
                  <td className="px-6 py-4 text-sm">
                    {key.name || 'Unnamed key'}
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-gray-600">
                    {key.key_prefix}...
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(key.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {key.last_used_at
                      ? new Date(key.last_used_at).toLocaleDateString()
                      : 'Never'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <DeleteKeyButton keyId={key.id} keyName={key.name} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
          <div className="text-gray-500 mb-4">No API keys yet</div>
          <p className="text-sm text-gray-400 mb-4">
            Create your first API key to start using the AgriMCP API
          </p>
          <CreateKeyButton />
        </div>
      )}

      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="text-sm text-amber-800">
          <strong>Security note:</strong> API keys provide full access to your
          account. Keep them secret and never share them in public repositories
          or client-side code.
        </div>
      </div>
    </div>
  );
}
