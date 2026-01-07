import { NextResponse } from 'next/server';
import { generateApiKey, hashApiKey } from '@/lib/api-keys';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { name } = body;

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
