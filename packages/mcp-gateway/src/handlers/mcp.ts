import type { MonthlyUsageCounter } from '../durable-objects/monthly-counter.js';
import { ApiError, Errors } from '../lib/errors.js';
import type { Env } from '../lib/types.js';
import {
  extractToolName,
  parseJsonBody,
  sanitizeObject,
  validateFarmerId,
  validateJsonDepth,
} from '../lib/validation.js';
import { extractApiKey, validateApiKey } from '../services/auth.js';
import {
  checkAuthRateLimit,
  checkRateLimit,
  recordAuthFailure,
} from '../services/rate-limit.js';
import { extractProvider, routeToProvider } from '../services/router.js';
import { logUsage } from '../services/usage.js';

export interface GatewayEnv extends Env {
  MONTHLY_COUNTER: DurableObjectNamespace<MonthlyUsageCounter>;
}

export async function handleMcpRequest(
  request: Request,
  env: GatewayEnv,
  ctx: ExecutionContext,
): Promise<Response> {
  const startTime = Date.now();
  const url = new URL(request.url);

  const clientIp =
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For')?.split(',')[0] ||
    'unknown';

  const authRateLimit = await checkAuthRateLimit(clientIp, env);
  if (!authRateLimit.allowed) {
    throw new ApiError(
      429,
      'Too many failed authentication attempts. Try again later.',
      'AUTH_RATE_LIMITED',
    );
  }

  const apiKey = extractApiKey(request);
  const validation = await validateApiKey(apiKey, env);

  if (
    !validation.valid ||
    !validation.developer ||
    !validation.subscription ||
    !validation.keyId
  ) {
    ctx.waitUntil(recordAuthFailure(clientIp, env));
    throw Errors.unauthorized();
  }

  const { developer, subscription, keyId } = validation;

  const provider = extractProvider(url.pathname);
  if (!provider) {
    throw Errors.notFound('Provider');
  }

  validateFarmerId(request.headers.get('X-Farmer-ID'));

  const counterStub = env.MONTHLY_COUNTER.get(
    env.MONTHLY_COUNTER.idFromName(developer.id),
  );
  const monthlyLimit = await counterStub.checkAndIncrement(
    developer.id,
    subscription.monthly_request_limit,
  );

  if (!monthlyLimit.allowed) {
    throw Errors.rateLimited(monthlyLimit.resetAt);
  }

  const rateLimit = await checkRateLimit(developer.id, subscription.tier, env);

  if (!rateLimit.allowed) {
    await counterStub.decrement(developer.id);
    throw Errors.rateLimited(rateLimit.resetAt);
  }

  let body: unknown;
  try {
    body = await parseJsonBody(request);
  } catch (e) {
    await counterStub.decrement(developer.id);
    throw e;
  }

  try {
    validateJsonDepth(body);
  } catch (e) {
    await counterStub.decrement(developer.id);
    throw e;
  }

  const sanitizedBody = sanitizeObject(body);
  const toolName = extractToolName(sanitizedBody);

  const modifiedRequest = new Request(request.url, {
    method: 'POST',
    headers: new Headers(request.headers),
    body: JSON.stringify(sanitizedBody),
  });
  modifiedRequest.headers.set('X-Developer-ID', developer.id);
  modifiedRequest.headers.set('X-API-Key-ID', keyId);
  modifiedRequest.headers.set('X-Tier', subscription.tier);

  let response: Response;
  let statusCode: number;
  try {
    response = await routeToProvider(modifiedRequest, provider, env);
    statusCode = response.status;
  } catch (e) {
    console.error('Provider error:', e);
    response = Errors.internal().toResponse();
    statusCode = 500;
  }

  const responseTime = Date.now() - startTime;

  await logUsage(
    {
      developerId: developer.id,
      apiKeyId: keyId,
      provider,
      toolName,
      responseTimeMs: responseTime,
      statusCode,
    },
    env,
  );

  const modifiedResponse = new Response(response.body, response);
  modifiedResponse.headers.set(
    'X-RateLimit-Remaining',
    String(rateLimit.remaining),
  );

  return modifiedResponse;
}
