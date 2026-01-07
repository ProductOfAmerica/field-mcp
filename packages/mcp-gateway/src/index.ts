import { createClient } from '@supabase/supabase-js';
import { extractApiKey, validateApiKey } from './auth.js';
import { ApiError, Errors } from './errors.js';
import { checkRateLimit } from './rate-limit.js';
import { extractProvider, routeToProvider } from './router.js';
import { logUsage } from './usage.js';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  RATE_LIMITS: KVNamespace;
  API_KEY_CACHE: KVNamespace;
  JOHN_DEERE_MCP: Fetcher;
  ENVIRONMENT: string;
  GATEWAY_SECRET: string;
  INTERNAL_SECRET: string;
}

const MAX_BODY_SIZE = 100 * 1024;
const MAX_JSON_DEPTH = 10;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Farmer-ID',
  'Access-Control-Max-Age': '86400',
};

function checkJsonDepth(obj: unknown, depth = 0): boolean {
  if (depth > MAX_JSON_DEPTH) return false;
  if (obj && typeof obj === 'object') {
    for (const value of Object.values(obj)) {
      if (!checkJsonDepth(value, depth + 1)) return false;
    }
  }
  return true;
}

function sanitizeObject<T>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeObject) as T;

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }
    sanitized[key] = sanitizeObject(value);
  }
  return sanitized as T;
}

function addCorsHeaders(response: Response): Response {
  const newResponse = new Response(response.body, response);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    newResponse.headers.set(key, value);
  });
  return newResponse;
}

async function handleCacheInvalidation(
  request: Request,
  env: Env,
): Promise<Response> {
  console.log('[CACHE INVALIDATION] Request received');
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const secret = request.headers.get('X-Internal-Secret');
  if (secret !== env.INTERNAL_SECRET) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: { developerId?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { developerId } = body;
  if (!developerId) {
    return new Response(JSON.stringify({ error: 'Missing developerId' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
  const { data: apiKeys } = await supabase
    .from('api_keys')
    .select('key_prefix')
    .eq('developer_id', developerId);

  const deletions: Promise<void>[] = [];

  if (apiKeys && apiKeys.length > 0) {
    for (const key of apiKeys) {
      deletions.push(env.API_KEY_CACHE.delete(`key:${key.key_prefix}`));
    }
  }

  const now = new Date();
  const prevMinute = new Date(now.getTime() - 60000);
  const currentKey = `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}-${now.getUTCHours()}-${now.getUTCMinutes()}`;
  const prevKey = `${prevMinute.getUTCFullYear()}-${prevMinute.getUTCMonth()}-${prevMinute.getUTCDate()}-${prevMinute.getUTCHours()}-${prevMinute.getUTCMinutes()}`;
  deletions.push(
    env.RATE_LIMITS.delete(`ratelimit:${developerId}:${currentKey}`),
  );
  deletions.push(env.RATE_LIMITS.delete(`ratelimit:${developerId}:${prevKey}`));
  console.log(
    `[CACHE INVALIDATION] Deleting keys for developer ${developerId}: ${currentKey}, ${prevKey}`,
  );

  await Promise.all(deletions);
  console.log(
    `[CACHE INVALIDATION] Deleted ${apiKeys?.length ?? 0} API key cache entries and rate limit keys`,
  );

  return new Response(
    JSON.stringify({
      invalidated: apiKeys?.length ?? 0,
      rateLimitCleared: true,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    const startTime = Date.now();
    const url = new URL(request.url);

    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (url.pathname === '/internal/invalidate-cache') {
      return handleCacheInvalidation(request, env);
    }

    if (request.method !== 'POST') {
      return addCorsHeaders(
        new ApiError(
          405,
          'Method not allowed',
          'METHOD_NOT_ALLOWED',
        ).toResponse(),
      );
    }

    const contentType = request.headers.get('Content-Type');
    if (!contentType || !contentType.includes('application/json')) {
      return addCorsHeaders(
        Errors.badRequest('Content-Type must be application/json').toResponse(),
      );
    }

    const contentLength = request.headers.get('Content-Length');
    if (contentLength && Number.parseInt(contentLength, 10) > MAX_BODY_SIZE) {
      return addCorsHeaders(
        Errors.badRequest('Request body too large').toResponse(),
      );
    }

    try {
      const apiKey = extractApiKey(request);
      const validation = await validateApiKey(apiKey, env);

      if (
        !validation.valid ||
        !validation.developer ||
        !validation.subscription ||
        !validation.keyId
      ) {
        throw Errors.unauthorized();
      }

      const { developer, subscription, keyId } = validation;

      const rateLimit = await checkRateLimit(
        developer.id,
        subscription.tier,
        env,
      );

      if (!rateLimit.allowed) {
        throw Errors.rateLimited(rateLimit.resetAt);
      }

      const provider = extractProvider(url.pathname);
      if (!provider) {
        throw Errors.notFound('Provider');
      }

      const farmerId = request.headers.get('X-Farmer-ID');
      if (!farmerId) {
        throw Errors.badRequest('Missing X-Farmer-ID header');
      }

      const hasControlChars = farmerId
        .split('')
        .some((c) => c.charCodeAt(0) < 0x20);
      if (farmerId.length > 128 || hasControlChars) {
        throw Errors.badRequest('Invalid X-Farmer-ID header');
      }

      let body: unknown;
      try {
        const text = await request.text();
        if (text.length > MAX_BODY_SIZE) {
          throw Errors.badRequest('Request body too large');
        }
        body = JSON.parse(text);
      } catch (e) {
        if (e instanceof ApiError) throw e;
        throw Errors.badRequest('Invalid JSON body');
      }

      if (!checkJsonDepth(body)) {
        throw Errors.badRequest('Request body too deeply nested');
      }

      const sanitizedBody = sanitizeObject(body);

      const modifiedRequest = new Request(request.url, {
        method: 'POST',
        headers: new Headers(request.headers),
        body: JSON.stringify(sanitizedBody),
      });
      modifiedRequest.headers.set('X-Developer-ID', developer.id);
      modifiedRequest.headers.set('X-API-Key-ID', keyId);
      modifiedRequest.headers.set('X-Tier', subscription.tier);

      const response = await routeToProvider(modifiedRequest, provider, env);

      const responseTime = Date.now() - startTime;
      ctx.waitUntil(
        (async () => {
          let toolName = 'unknown';
          try {
            const parsedBody = sanitizedBody as {
              method?: string;
              params?: { name?: string };
            };
            if (parsedBody.method === 'tools/call' && parsedBody.params?.name) {
              toolName = parsedBody.params.name;
            } else if (parsedBody.method) {
              toolName = parsedBody.method;
            }
          } catch {}

          await logUsage(
            {
              developerId: developer.id,
              apiKeyId: keyId,
              provider,
              toolName,
              responseTimeMs: responseTime,
              statusCode: response.status,
            },
            env,
          );
        })(),
      );

      const modifiedResponse = new Response(response.body, response);
      modifiedResponse.headers.set(
        'X-RateLimit-Remaining',
        String(rateLimit.remaining),
      );

      return addCorsHeaders(modifiedResponse);
    } catch (error) {
      if (error instanceof ApiError) {
        return addCorsHeaders(error.toResponse());
      }
      console.error('Unexpected error:', error);
      return addCorsHeaders(Errors.internal().toResponse());
    }
  },
};
