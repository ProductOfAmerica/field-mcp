import { getSupabaseClient } from './supabase-client.ts';

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

function getMonthStart(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0),
  );
}

function getMonthEnd(): number {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0),
  ).getTime();
}

export interface MonthlyCheckResult {
  allowed: boolean;
  count: number;
  resetAt: number;
}

export async function checkAndIncrementMonthly(
  developerId: string,
  limit: number,
): Promise<MonthlyCheckResult> {
  const supabase = getSupabaseClient();
  const month = getCurrentMonth();

  const { data: existing } = await supabase
    .from('monthly_usage')
    .select('count, seeded')
    .eq('developer_id', developerId)
    .eq('month', month)
    .single();

  if (!existing) {
    const monthStart = getMonthStart();
    const { count: dbCount } = await supabase
      .from('usage_logs')
      .select('*', { count: 'exact', head: true })
      .eq('developer_id', developerId)
      .gte('request_timestamp', monthStart.toISOString());

    const initialCount = dbCount ?? 0;
    console.log(`[rate_limit:monthly] seeded: ${initialCount}`);

    if (initialCount >= limit) {
      console.log(`[rate_limit:monthly] denied: ${initialCount}/${limit}`);
      return { allowed: false, count: initialCount, resetAt: getMonthEnd() };
    }

    await supabase.from('monthly_usage').upsert(
      {
        developer_id: developerId,
        month,
        count: initialCount + 1,
        seeded: true,
      },
      {
        onConflict: 'developer_id,month',
      },
    );

    console.log(`[rate_limit:monthly] allowed: ${initialCount + 1}/${limit}`);
    return { allowed: true, count: initialCount + 1, resetAt: 0 };
  }

  if (existing.count >= limit) {
    console.log(`[rate_limit:monthly] denied: ${existing.count}/${limit}`);
    return { allowed: false, count: existing.count, resetAt: getMonthEnd() };
  }

  const { data: updated, error } = await supabase.rpc(
    'increment_monthly_usage',
    {
      p_developer_id: developerId,
      p_month: month,
      p_limit: limit,
    },
  );

  if (error) {
    console.error('[rate_limit:monthly] increment error:', error);
    return { allowed: false, count: existing.count, resetAt: getMonthEnd() };
  }

  const allowed = updated?.allowed ?? false;
  const count = updated?.count ?? existing.count;

  console.log(
    `[rate_limit:monthly] ${allowed ? 'allowed' : 'denied'}: ${count}/${limit}`,
  );
  return { allowed, count, resetAt: allowed ? 0 : getMonthEnd() };
}

export async function decrementMonthly(developerId: string): Promise<number> {
  const supabase = getSupabaseClient();
  const month = getCurrentMonth();

  const { data } = await supabase
    .from('monthly_usage')
    .select('count')
    .eq('developer_id', developerId)
    .eq('month', month)
    .single();

  if (!data || data.count <= 0) {
    return 0;
  }

  const newCount = data.count - 1;
  await supabase
    .from('monthly_usage')
    .update({ count: newCount })
    .eq('developer_id', developerId)
    .eq('month', month);

  console.log(`[rate_limit:monthly] decremented: ${newCount}`);
  return newCount;
}
