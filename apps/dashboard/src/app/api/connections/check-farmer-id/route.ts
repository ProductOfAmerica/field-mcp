import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const checkFarmerIdSchema = z.object({
  farmer_id: z.string().min(1).max(100),
  provider: z
    .enum(['john_deere', 'climate_fieldview', 'cnhi'])
    .default('john_deere'),
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
  const parsed = checkFarmerIdSchema.safeParse({
    farmer_id: searchParams.get('farmer_id'),
    provider: searchParams.get('provider') || 'john_deere',
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? 'Invalid parameters' },
      { status: 400 },
    );
  }

  const { farmer_id, provider } = parsed.data;

  // Case-insensitive check for active connections only
  const { data: existing } = await supabase
    .from('farmer_connections')
    .select('id, is_active')
    .eq('developer_id', user.id)
    .eq('provider', provider)
    .ilike(
      'farmer_identifier',
      farmer_id.replace(/%/g, '\\%').replace(/_/g, '\\_'),
    )
    .limit(1)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({
      available: false,
      exists: true,
      isActive: existing.is_active,
      message: existing.is_active
        ? 'A connection with this Farmer ID already exists. Continuing will refresh the tokens.'
        : 'A disconnected connection with this Farmer ID exists. Continuing will reactivate it.',
    });
  }

  return NextResponse.json({ available: true, exists: false });
}
