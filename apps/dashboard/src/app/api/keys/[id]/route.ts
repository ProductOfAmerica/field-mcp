import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: key } = await supabase
    .from('api_keys')
    .select('developer_id')
    .eq('id', id)
    .single();

  if (!key || key.developer_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { error } = await supabase
    .from('api_keys')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
