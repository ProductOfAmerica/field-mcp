import { getSupabaseClient } from './supabase-client.ts';

export type Provider = 'john_deere' | 'climate' | 'cnhi';

export async function getFarmerConnections(
  developerId: string,
  farmerId: string,
): Promise<Provider[]> {
  const supabase = getSupabaseClient();

  const { data: connections, error } = await supabase
    .from('farmer_connections')
    .select('provider')
    .eq('developer_id', developerId)
    .eq('farmer_identifier', farmerId)
    .eq('is_active', true);

  if (error) {
    console.error('[error] Failed to fetch farmer connections:', error);
    return [];
  }

  return (connections ?? []).map((c) => c.provider as Provider);
}
