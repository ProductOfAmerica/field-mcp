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
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Farmer-ID',
  'Access-Control-Max-Age': '86400',
};

function addCorsHeaders(response: Response): Response {
  const newResponse = new Response(response.body, response);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    newResponse.headers.set(key, value);
  });
  return newResponse;
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

      const modifiedRequest = new Request(request, {
        headers: new Headers(request.headers),
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
            const body = (await request.clone().json()) as {
              method?: string;
              params?: { name?: string };
            };
            if (body.method === 'tools/call' && body.params?.name) {
              toolName = body.params.name;
            } else if (body.method) {
              toolName = body.method;
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
