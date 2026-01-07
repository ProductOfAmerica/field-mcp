import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const JOHN_DEERE_AUTH_URL =
  'https://signin.johndeere.com/oauth2/aus78tnlaysMraFhC1t7/v1/authorize';

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const { searchParams } = new URL(request.url);
  const farmerId = searchParams.get('farmer_id');

  if (!farmerId) {
    return NextResponse.json(
      { error: 'farmer_id parameter is required' },
      { status: 400 },
    );
  }

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
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10,
    path: '/',
  });
  cookieStore.set('oauth_state_data', JSON.stringify(stateData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10,
    path: '/',
  });

  const authUrl = new URL(JOHN_DEERE_AUTH_URL);
  authUrl.searchParams.set('client_id', process.env.JOHN_DEERE_CLIENT_ID ?? '');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set(
    'redirect_uri',
    process.env.JOHN_DEERE_REDIRECT_URI ?? '',
  );
  authUrl.searchParams.set('scope', 'ag1 ag2 ag3 offline_access');
  authUrl.searchParams.set('state', state);

  return NextResponse.redirect(authUrl.toString());
}
