import { decrementMonthly } from './monthly-usage.ts';
import { getSupabaseClient } from './supabase-client.ts';

interface UsageParams {
  developerId: string;
  apiKeyId: string;
  farmerConnectionId?: string;
  provider: string;
  toolName: string;
  responseTimeMs: number;
  statusCode: number;
  errorType?: string;
}

export async function logUsage(params: UsageParams): Promise<void> {
  const supabase = getSupabaseClient();

  const insertData = {
    developer_id: params.developerId,
    api_key_id: params.apiKeyId,
    farmer_connection_id: params.farmerConnectionId,
    provider: params.provider,
    tool_name: params.toolName,
    response_time_ms: params.responseTimeMs,
    status_code: params.statusCode,
    error_type: params.errorType,
  };

  const { data, error } = await supabase
    .from('usage_logs')
    .insert(insertData)
    .select('id');

  if (error) {
    console.error('[usage] failed:', error);
    await decrementMonthly(params.developerId);
    return;
  }

  console.log(
    `[usage] logged: status=${params.statusCode} id=${data?.[0]?.id?.slice(0, 8) ?? 'none'}`,
  );
}
