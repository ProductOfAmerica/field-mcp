import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const checkNameSchema = z.object({
  name: z.string().min(1).max(100),
});

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = checkNameSchema.safeParse({ name: searchParams.get('name') });

  if (!parsed.success) {
    // Empty/invalid names are "available" (allowed as unnamed keys)
    return NextResponse.json({ available: true });
  }

  const { name } = parsed.data;

  // Case-insensitive check for active keys only
  const { data: existing } = await supabase
    .from('api_keys')
    .select('id')
    .eq('developer_id', user.id)
    .eq('is_active', true)
    .ilike('name', name)
    .limit(1)
    .single();

  return NextResponse.json({
    available: !existing,
    message: existing ? 'An API key with this name already exists' : undefined,
  });
}
