import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { createClient } from '@/lib/supabase/server';

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  const cookieStore = await cookies();
  const storedState = cookieStore.get('oauth_state')?.value;
  const stateDataStr = cookieStore.get('oauth_state_data')?.value;

  if (error) {
    const returnUrl = stateDataStr
      ? JSON.parse(stateDataStr).returnUrl
      : '/dashboard/connections';
    cookieStore.delete('oauth_state');
    cookieStore.delete('oauth_state_data');
    return NextResponse.redirect(
      new URL(
        `${returnUrl}?error=${encodeURIComponent(errorDescription || error)}`,
        request.url,
      ),
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL(
        '/dashboard/connections?error=Missing+authorization+code',
        request.url,
      ),
    );
  }

  if (state !== storedState) {
    cookieStore.delete('oauth_state');
    cookieStore.delete('oauth_state_data');
    return NextResponse.redirect(
      new URL(
        '/dashboard/connections?error=Invalid+state+parameter',
        request.url,
      ),
    );
  }

  if (!stateDataStr) {
    return NextResponse.redirect(
      new URL('/dashboard/connections?error=Missing+state+data', request.url),
    );
  }

  const stateData = JSON.parse(stateDataStr) as {
    developerId: string;
    farmerId: string;
    returnUrl: string;
  };

  const basicAuth = Buffer.from(
    `${config.johnDeere.clientId}:${config.johnDeere.clientSecret}`,
  ).toString('base64');

  const tokenResponse = await fetch(config.johnDeere.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.johnDeere.redirectUri,
    }),
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    console.error('Token exchange failed:', errorText);
    cookieStore.delete('oauth_state');
    cookieStore.delete('oauth_state_data');
    return NextResponse.redirect(
      new URL(
        '/dashboard/connections?error=Token+exchange+failed',
        request.url,
      ),
    );
  }

  const tokens = (await tokenResponse.json()) as TokenResponse;

  const accessTokenEncrypted = Buffer.from(tokens.access_token).toString(
    'base64',
  );
  const refreshTokenEncrypted = Buffer.from(tokens.refresh_token).toString(
    'base64',
  );
  const tokenExpiresAt = new Date(
    Date.now() + tokens.expires_in * 1000,
  ).toISOString();
  const scopes = tokens.scope.split(' ');

  const supabase = await createClient();

  const { error: dbError } = await supabase.from('farmer_connections').upsert(
    {
      developer_id: stateData.developerId,
      farmer_identifier: stateData.farmerId,
      provider: 'john_deere',
      access_token_encrypted: accessTokenEncrypted,
      refresh_token_encrypted: refreshTokenEncrypted,
      token_expires_at: tokenExpiresAt,
      scopes,
      is_active: true,
    },
    {
      onConflict: 'developer_id,farmer_identifier,provider',
    },
  );

  cookieStore.delete('oauth_state');
  cookieStore.delete('oauth_state_data');

  if (dbError) {
    console.error('Failed to store tokens:', dbError);
    return NextResponse.redirect(
      new URL(
        '/dashboard/connections?error=Failed+to+store+connection',
        request.url,
      ),
    );
  }

  revalidatePath('/dashboard/connections');

  return NextResponse.redirect(
    new URL(`${stateData.returnUrl}?success=true`, request.url),
  );
}
