import { createClient } from '@supabase/supabase-js';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  TOKEN_CACHE: KVNamespace;
  JOHN_DEERE_CLIENT_ID: string;
  JOHN_DEERE_CLIENT_SECRET: string;
}

interface TokenData {
  accessToken: string;
  expiresAt: number;
}

export async function getToken(
  developerId: string,
  farmerId: string,
  env: Env,
): Promise<string> {
  const cacheKey = `token:${developerId}:${farmerId}:john_deere`;

  const cached = (await env.TOKEN_CACHE.get(
    cacheKey,
    'json',
  )) as TokenData | null;
  if (cached && cached.expiresAt > Date.now() + 60000) {
    return cached.accessToken;
  }

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

  const { data: connection, error } = await supabase
    .from('farmer_connections')
    .select('id, access_token_encrypted, refresh_token_encrypted, token_expires_at')
    .eq('developer_id', developerId)
    .eq('farmer_identifier', farmerId)
    .eq('provider', 'john_deere')
    .eq('is_active', true)
    .single();

  if (error || !connection) {
    throw new Error(`No active John Deere connection for farmer: ${farmerId}`);
  }

  const accessToken = atob(connection.access_token_encrypted);
  const refreshToken = atob(connection.refresh_token_encrypted);
  const expiresAt = connection.token_expires_at
    ? new Date(connection.token_expires_at).getTime()
    : 0;

  if (expiresAt < Date.now() + 300000) {
    const refreshed = await refreshAccessToken(refreshToken, env);

    await supabase
      .from('farmer_connections')
      .update({
        access_token_encrypted: btoa(refreshed.accessToken),
        refresh_token_encrypted: btoa(refreshed.refreshToken),
        token_expires_at: new Date(refreshed.expiresAt).toISOString(),
      })
      .eq('id', connection.id);

    await env.TOKEN_CACHE.put(
      cacheKey,
      JSON.stringify({
        accessToken: refreshed.accessToken,
        expiresAt: refreshed.expiresAt,
      }),
      { expirationTtl: 3500 },
    );

    return refreshed.accessToken;
  }

  await env.TOKEN_CACHE.put(
    cacheKey,
    JSON.stringify({ accessToken, expiresAt }),
    { expirationTtl: Math.floor((expiresAt - Date.now()) / 1000) },
  );

  return accessToken;
}

async function refreshAccessToken(
  refreshToken: string,
  env: Env,
): Promise<{ accessToken: string; refreshToken: string; expiresAt: number }> {
  const response = await fetch(
    'https://signin.johndeere.com/oauth2/aus78tnlaysMraFhC1t7/v1/token',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${btoa(`${env.JOHN_DEERE_CLIENT_ID}:${env.JOHN_DEERE_CLIENT_SECRET}`)}`,
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
