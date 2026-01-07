import { MonthlyUsageCounter } from './durable-objects/monthly-counter.js';
import { handleCacheInvalidation } from './handlers/cache-invalidation.js';
import { type GatewayEnv, handleMcpRequest } from './handlers/mcp.js';
import { CORS_HEADERS } from './lib/constants.js';
import { ApiError, Errors } from './lib/errors.js';
import { jsonResponse, withCors } from './lib/middleware.js';
import {
  validateContentLength,
  validateContentType,
} from './lib/validation.js';

export { MonthlyUsageCounter };

export default {
  async fetch(
    request: Request,
    env: GatewayEnv,
    ctx: ExecutionContext,
  ): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    if (url.pathname === '/health') {
      return jsonResponse({ status: 'ok' }, 200, CORS_HEADERS);
    }

    if (url.pathname === '/internal/invalidate-cache') {
      return handleCacheInvalidation(request, env);
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
      const response = await handleMcpRequest(request, env, ctx);
      return withCors(response);
    } catch (error) {
      if (error instanceof ApiError) {
        return withCors(error.toResponse());
      }
      console.error('Unexpected error:', error);
      return withCors(Errors.internal().toResponse());
    }
  },
};
