import { NextResponse } from 'next/server';
import { z } from 'zod';
import { generateApiKey, hashApiKey } from '@/lib/api-keys';
import { createClient } from '@/lib/supabase/server';

const createKeySchema = z.object({
  name: z
    .string()
    .max(100, 'Name must be 100 characters or less')
    .optional()
    .nullable(),
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

  const { key, prefix } = generateApiKey();
  const keyHash = await hashApiKey(key);

  const { error } = await supabase.from('api_keys').insert({
    developer_id: user.id,
    key_hash: keyHash,
    key_prefix: prefix,
    name: name || null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ key });
}
