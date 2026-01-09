import { MAX_BODY_SIZE, MAX_JSON_DEPTH } from './constants.ts';
import { Errors } from './errors.ts';

export function validateContentType(request: Request): void {
  const contentType = request.headers.get('Content-Type');
  if (!contentType || !contentType.includes('application/json')) {
    throw Errors.badRequest('Content-Type must be application/json');
  }
}

export function validateContentLength(request: Request): void {
  const contentLength = request.headers.get('Content-Length');
  if (contentLength && Number.parseInt(contentLength, 10) > MAX_BODY_SIZE) {
    throw Errors.badRequest('Request body too large');
  }
}

function checkJsonDepth(obj: unknown, depth = 0): boolean {
  if (depth > MAX_JSON_DEPTH) return false;
  if (obj && typeof obj === 'object') {
    for (const value of Object.values(obj)) {
      if (!checkJsonDepth(value, depth + 1)) return false;
    }
  }
  return true;
}

export function validateJsonDepth(body: unknown): void {
  if (!checkJsonDepth(body)) {
    throw Errors.badRequest('Request body too deeply nested');
  }
}

export async function parseJsonBody(request: Request): Promise<unknown> {
  const text = await request.text();
  if (text.length > MAX_BODY_SIZE) {
    throw Errors.badRequest('Request body too large');
  }
  try {
    return JSON.parse(text);
  } catch {
    throw Errors.badRequest('Invalid JSON body');
  }
}

export function sanitizeObject<T>(obj: T): T {
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

export function validateFarmerId(farmerId: string | null): string {
  if (!farmerId) {
    throw Errors.badRequest('Missing X-Farmer-ID header');
  }
  const hasControlChars = farmerId
    .split('')
    .some((c) => c.charCodeAt(0) < 0x20);
  if (farmerId.length > 128 || hasControlChars) {
    throw Errors.badRequest('Invalid X-Farmer-ID header');
  }
  return farmerId;
}

export function extractToolName(body: unknown): string {
  try {
    const parsed = body as {
      method?: string;
      params?: { name?: string };
    };
    if (parsed.method === 'tools/call' && parsed.params?.name) {
      return parsed.params.name;
    }
    if (parsed.method) {
      return parsed.method;
    }
  } catch {
    /* ignore */
  }
  return 'unknown';
}
