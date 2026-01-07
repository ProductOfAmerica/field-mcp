import { DurableObject } from 'cloudflare:workers';
import { createClient } from '@supabase/supabase-js';

export interface Env {
  MONTHLY_COUNTER: DurableObjectNamespace<MonthlyUsageCounter>;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
}

interface UsageData {
  month: string;
  count: number;
  seeded: boolean;
}

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

export class MonthlyUsageCounter extends DurableObject<Env> {
  private async getData(developerId: string): Promise<UsageData> {
    const stored = await this.ctx.storage.get<UsageData>('usage');
    const currentMonth = getCurrentMonth();

    if (!stored || stored.month !== currentMonth) {
      const supabase = createClient(
        this.env.SUPABASE_URL,
        this.env.SUPABASE_SERVICE_KEY,
      );
      const monthStart = getMonthStart();

      const { count, error } = await supabase
        .from('usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('developer_id', developerId)
        .gte('request_timestamp', monthStart.toISOString());

      const dbCount = error ? 0 : (count ?? 0);
      console.log(`[DO MONTHLY] seeded from DB: ${dbCount}`);

      const fresh: UsageData = {
        month: currentMonth,
        count: dbCount,
        seeded: true,
      };
      await this.ctx.storage.put('usage', fresh);
      return fresh;
    }

    return stored;
  }

  async checkAndIncrement(
    developerId: string,
    limit: number,
  ): Promise<{ allowed: boolean; count: number; resetAt: number }> {
    return await this.ctx.blockConcurrencyWhile(async () => {
      const data = await this.getData(developerId);

      if (data.count >= limit) {
        console.log(`[DO MONTHLY] DENIED: ${data.count}/${limit}`);
        return { allowed: false, count: data.count, resetAt: getMonthEnd() };
      }

      data.count += 1;
      await this.ctx.storage.put('usage', data);

      console.log(`[DO MONTHLY] ALLOWED: ${data.count}/${limit}`);
      return { allowed: true, count: data.count, resetAt: 0 };
    });
  }

  async getCount(developerId: string): Promise<number> {
    const data = await this.getData(developerId);
    return data.count;
  }

  async decrement(developerId: string): Promise<number> {
    const data = await this.getData(developerId);
    if (data.count > 0) {
      data.count -= 1;
      await this.ctx.storage.put('usage', data);
      console.log(`[DO MONTHLY] decremented to ${data.count}`);
    }
    return data.count;
  }

  async reset(): Promise<void> {
    const currentMonth = getCurrentMonth();
    await this.ctx.storage.put('usage', {
      month: currentMonth,
      count: 0,
      seeded: false,
    });
  }
}
