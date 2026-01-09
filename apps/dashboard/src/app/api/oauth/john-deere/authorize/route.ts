import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { config } from '@/lib/config';
import { createClient } from '@/lib/supabase/server';

const authorizeSchema = z.object({
  farmer_id: z
    .string()
    .min(1, 'Farmer ID is required')
    .max(100, 'Farmer ID too long')
    .regex(/^[\w-]+$/, 'Invalid farmer ID format'),
});

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const { searchParams } = new URL(request.url);
  const parsed = authorizeSchema.safeParse({
    farmer_id: searchParams.get('farmer_id'),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? 'Invalid farmer_id' },
      { status: 400 },
    );
  }

  const farmerId = parsed.data.farmer_id;

  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  const state = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const stateData = {
    developerId: user.id,
    farmerId,
    returnUrl: '/dashboard/connections',
  };

  const cookieStore = await cookies();
  cookieStore.set('oauth_state', state, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'lax',
    maxAge: 60 * 10,
    path: '/',
  });
  cookieStore.set('oauth_state_data', JSON.stringify(stateData), {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'lax',
    maxAge: 60 * 10,
    path: '/',
  });

  const authUrl = new URL(config.johnDeere.authUrl);
  authUrl.searchParams.set('client_id', config.johnDeere.clientId);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('redirect_uri', config.johnDeere.redirectUri);
  authUrl.searchParams.set('scope', 'ag1 ag2 ag3 offline_access');
  authUrl.searchParams.set('state', state);

  return NextResponse.redirect(authUrl.toString());
}
