import { cacheGet, cacheSet } from './cache.ts';
import { TOKEN_CACHE_TTL } from './constants.ts';
import { getSupabaseClient } from './supabase-client.ts';

interface TokenData {
  accessToken: string;
  expiresAt: number;
}

export async function getToken(
  developerId: string,
  farmerId: string,
): Promise<string> {
  const cacheKey = `token:${developerId}:${farmerId}:john_deere`;

  const cached = await cacheGet<TokenData>('token_cache', cacheKey);
  if (cached && cached.expiresAt > Date.now() + 60000) {
    return cached.accessToken;
  }

  const supabase = getSupabaseClient();

  const { data: connection, error } = await supabase
    .from('farmer_connections')
    .select(
      'id, access_token_encrypted, refresh_token_encrypted, token_expires_at',
    )
    .eq('developer_id', developerId)
    .eq('farmer_identifier', farmerId)
    .eq('provider', 'john_deere')
    .eq('is_active', true)
    .single();

  if (error || !connection) {
    throw new Error('No active John Deere connection found');
  }

  const accessToken = atob(connection.access_token_encrypted);
  const refreshToken = atob(connection.refresh_token_encrypted);
  const expiresAt = connection.token_expires_at
    ? new Date(connection.token_expires_at).getTime()
    : 0;

  if (expiresAt < Date.now() + 300000) {
    const refreshed = await refreshAccessToken(refreshToken);

    await supabase
      .from('farmer_connections')
      .update({
        access_token_encrypted: btoa(refreshed.accessToken),
        refresh_token_encrypted: btoa(refreshed.refreshToken),
        token_expires_at: new Date(refreshed.expiresAt).toISOString(),
      })
      .eq('id', connection.id);

    await cacheSet(
      'token_cache',
      cacheKey,
      {
        accessToken: refreshed.accessToken,
        expiresAt: refreshed.expiresAt,
      },
      {
        expirationTtl: TOKEN_CACHE_TTL,
      },
    );

    return refreshed.accessToken;
  }

  await cacheSet(
    'token_cache',
    cacheKey,
    { accessToken, expiresAt },
    {
      expirationTtl: Math.floor((expiresAt - Date.now()) / 1000),
    },
  );

  return accessToken;
}

async function refreshAccessToken(
  refreshToken: string,
): Promise<{ accessToken: string; refreshToken: string; expiresAt: number }> {
  const clientId = Deno.env.get('JOHN_DEERE_CLIENT_ID');
  const clientSecret = Deno.env.get('JOHN_DEERE_CLIENT_SECRET');

  if (!clientId || !clientSecret) {
    throw new Error('Missing John Deere client credentials');
  }

  const response = await fetch(
    'https://signin.johndeere.com/oauth2/aus78tnlaysMraFhC1t7/v1/token',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${response.status}`);
  }

  const data = (await response.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
}
