import { NextResponse } from 'next/server';
import { z } from 'zod';
import { generateApiKey, hashApiKey } from '@/lib/api-keys';
import { createClient } from '@/lib/supabase/server';

const createKeySchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less'),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = createKeySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { name } = parsed.data;

  // Check for duplicate name (case-insensitive) before insert
  const { data: existing } = await supabase
    .from('api_keys')
    .select('id')
    .eq('developer_id', user.id)
    .eq('is_active', true)
    .ilike('name', name.replace(/%/g, '\\%').replace(/_/g, '\\_'))
    .limit(1)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      {
        error: 'An API key with this name already exists',
        code: 'DUPLICATE_NAME',
      },
      { status: 409 },
    );
  }

  const { key, prefix } = generateApiKey();
  const keyHash = await hashApiKey(key);

  const { error } = await supabase.from('api_keys').insert({
    developer_id: user.id,
    key_hash: keyHash,
    key_prefix: prefix,
    name,
  });

  if (error) {
    // Handle race condition - constraint violation from concurrent insert
    if (error.code === '23505') {
      return NextResponse.json(
        {
          error: 'An API key with this name already exists',
          code: 'DUPLICATE_NAME',
        },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ key });
}
