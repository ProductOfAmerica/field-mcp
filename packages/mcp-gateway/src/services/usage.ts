import { createClient } from '@supabase/supabase-js';
import type { MonthlyUsageCounter } from '../durable-objects/monthly-counter.js';
import type { Env } from '../lib/types.js';

interface UsageEnv extends Env {
  MONTHLY_COUNTER: DurableObjectNamespace<MonthlyUsageCounter>;
}

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

export async function logUsage(
  params: UsageParams,
  env: UsageEnv,
): Promise<void> {
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

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
    console.error('[USAGE] Failed to log:', error);
    const stub = env.MONTHLY_COUNTER.get(
      env.MONTHLY_COUNTER.idFromName(params.developerId),
    );
    await stub.decrement(params.developerId);
    return;
  }

  console.log(
    `[USAGE] logged: status=${params.statusCode}, id=${data?.[0]?.id?.slice(0, 8) ?? 'none'}`,
  );
}
