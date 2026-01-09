import { extractApiKey, validateApiKey } from '../_shared/core/auth/auth.ts';
import {
  checkAuthRateLimit,
  checkRateLimit,
  getMinuteKey,
  recordAuthFailure,
} from '../_shared/core/auth/rate-limit.ts';
import {
  checkAndIncrementMonthly,
  decrementMonthly,
} from '../_shared/core/billing/monthly-usage.ts';
import { logUsage } from '../_shared/core/billing/usage.ts';
import { CORS_HEADERS } from '../_shared/core/constants.ts';
import { ApiError, Errors } from '../_shared/core/errors.ts';
import { jsonResponse, withCors } from '../_shared/core/middleware.ts';
import {
  cacheDelete,
  cacheDeletePattern,
} from '../_shared/core/routing/cache.ts';
import {
  getFarmerConnections,
  type Provider,
} from '../_shared/core/routing/router.ts';
import { getSupabaseClient } from '../_shared/core/supabase-client.ts';
import {
  extractToolName,
  parseJsonBody,
  sanitizeObject,
  validateContentLength,
  validateContentType,
  validateFarmerId,
  validateJsonDepth,
} from '../_shared/core/validation.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const JOHN_DEERE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/mcp-john-deere`;

async function handleMcpRequest(request: Request): Promise<Response> {
  const startTime = Date.now();

  const apiKey = extractApiKey(request);
  const authRateLimitKey = apiKey ? apiKey.slice(0, 14) : 'unknown';

  const authRateLimit = await checkAuthRateLimit(authRateLimitKey);
  if (!authRateLimit.allowed) {
    throw new ApiError(
      429,
      'Too many failed authentication attempts. Try again later.',
      'AUTH_RATE_LIMITED',
    );
  }

  const validation = await validateApiKey(apiKey);

  if (
    !validation.valid ||
    !validation.developer ||
    !validation.subscription ||
    !validation.keyId
  ) {
    recordAuthFailure(authRateLimitKey);
    throw Errors.unauthorized();
  }

  const { developer, subscription, keyId } = validation;

  const farmerId = request.headers.get('X-Farmer-ID');
  validateFarmerId(farmerId);

  const connectedProviders = await getFarmerConnections(
    developer.id,
    farmerId!,
  );

  if (connectedProviders.length === 0) {
    throw new ApiError(
      400,
      'No providers connected for this farmer. Connect a provider in the dashboard first.',
      'NO_PROVIDERS',
    );
  }

  const monthlyLimit = await checkAndIncrementMonthly(
    developer.id,
    subscription.monthly_request_limit,
  );

  if (!monthlyLimit.allowed) {
    throw Errors.rateLimited(monthlyLimit.resetAt);
  }

  const rateLimit = await checkRateLimit(developer.id, subscription.tier);

  if (!rateLimit.allowed) {
    await decrementMonthly(developer.id);
    throw Errors.rateLimited(rateLimit.resetAt);
  }

  let body: unknown;
  try {
    body = await parseJsonBody(request);
  } catch (e) {
    await decrementMonthly(developer.id);
    throw e;
  }

  try {
    validateJsonDepth(body);
  } catch (e) {
    await decrementMonthly(developer.id);
    throw e;
  }

  const sanitizedBody = sanitizeObject(body) as {
    method?: string;
    params?: { arguments?: { provider?: Provider } };
  };
  const toolName = extractToolName(sanitizedBody);

  const requestedProvider = sanitizedBody.params?.arguments?.provider;
  let provider: Provider;

  if (requestedProvider) {
    if (!connectedProviders.includes(requestedProvider)) {
      throw new ApiError(
        400,
        `Provider '${requestedProvider}' is not connected for this farmer`,
        'PROVIDER_NOT_CONNECTED',
      );
    }
    provider = requestedProvider;
  } else if (connectedProviders.length === 1) {
    provider = connectedProviders[0]!;
  } else {
    throw new ApiError(
      400,
      `Multiple providers connected. Specify 'provider' in arguments: ${connectedProviders.join(', ')}`,
      'AMBIGUOUS_PROVIDER',
    );
  }

  let response: Response;
  let statusCode: number;
  try {
    response = await routeToProvider(
      sanitizedBody,
      provider,
      developer.id,
      farmerId!,
      keyId,
      subscription.tier,
    );
    statusCode = response.status;
  } catch (e) {
    console.error('[error] provider:', e);
    response = Errors.internal().toResponse();
    statusCode = 500;
  }

  const responseTime = Date.now() - startTime;

  logUsage({
    developerId: developer.id,
    apiKeyId: keyId,
    provider,
    toolName,
    responseTimeMs: responseTime,
    statusCode,
  });

  const modifiedResponse = new Response(response.body, response);
  modifiedResponse.headers.set(
    'X-RateLimit-Remaining',
    String(rateLimit.remaining),
  );

  return modifiedResponse;
}

async function routeToProvider(
  body: unknown,
  provider: Provider,
  developerId: string,
  farmerId: string,
  apiKeyId: string,
  tier: string,
): Promise<Response> {
  switch (provider) {
    case 'john_deere': {
      if (!JOHN_DEERE_FUNCTION_URL) {
        throw new Error('JOHN_DEERE_FUNCTION_URL not configured');
      }

      return await fetch(JOHN_DEERE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Developer-ID': developerId,
          'X-Farmer-ID': farmerId,
          'X-API-Key-ID': apiKeyId,
          'X-Tier': tier,
        },
        body: JSON.stringify(body),
      });
    }
    default:
      return new Response(
        JSON.stringify({
          error: {
            message: `Provider not yet supported: ${provider}`,
            code: 'NOT_IMPLEMENTED',
          },
        }),
        { status: 501, headers: { 'Content-Type': 'application/json' } },
      );
  }
}

async function handleCacheInvalidation(request: Request): Promise<Response> {
  console.log('[cache] invalidation request');

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const internalSecret = Deno.env.get('INTERNAL_SECRET');
  const secret = request.headers.get('X-Internal-Secret');
  if (secret !== internalSecret) {
    return jsonResponse({ error: 'Forbidden' }, 403);
  }

  let body: { developerId?: string };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  const { developerId } = body;
  if (!developerId) {
    return jsonResponse({ error: 'Missing developerId' }, 400);
  }

  const supabase = getSupabaseClient();
  const { data: apiKeys } = await supabase
    .from('api_keys')
    .select('key_prefix')
    .eq('developer_id', developerId);

  let deletedCount = 0;

  if (apiKeys && apiKeys.length > 0) {
    for (const key of apiKeys) {
      await cacheDelete('api_key_cache', `key:${key.key_prefix}`);
      deletedCount++;
    }
  }

  const tokenDeletedCount = await cacheDeletePattern(
    'token_cache',
    `token:${developerId}:%`,
  );

  const now = new Date();
  const prevMinute = new Date(now.getTime() - 60000);
  const currentKey = getMinuteKey(now);
  const prevKey = getMinuteKey(prevMinute);

  await cacheDelete('rate_limits', `ratelimit:${developerId}:${currentKey}`);
  await cacheDelete('rate_limits', `ratelimit:${developerId}:${prevKey}`);

  console.log(
    `[cache] cleared: ${deletedCount} api keys, ${tokenDeletedCount} tokens for developer=${developerId}`,
  );

  return jsonResponse({
    invalidated: deletedCount,
    tokensInvalidated: tokenDeletedCount,
    rateLimitCleared: true,
  });
}

Deno.serve(async (request: Request): Promise<Response> => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const url = new URL(request.url);

  // Health check - GET only
  if (
    request.method === 'GET' &&
    (url.pathname === '/mcp-gateway/health' || url.pathname === '/mcp-gateway')
  ) {
    return jsonResponse({ status: 'ok' }, 200, CORS_HEADERS);
  }

  if (url.pathname === '/mcp-gateway/internal/invalidate-cache') {
    return handleCacheInvalidation(request);
  }

  if (request.method !== 'POST') {
    return withCors(
      new ApiError(
        405,
        'Method not allowed',
        'METHOD_NOT_ALLOWED',
      ).toResponse(),
    );
  }

  try {
    validateContentType(request);
    validateContentLength(request);
    const response = await handleMcpRequest(request);
    return withCors(response);
  } catch (error) {
    if (error instanceof ApiError) {
      return withCors(error.toResponse());
    }
    console.error('[error] gateway:', error);
    return withCors(Errors.internal().toResponse());
  }
});
