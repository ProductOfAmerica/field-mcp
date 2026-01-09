export const MAX_BODY_SIZE = 100 * 1024;
export const MAX_JSON_DEPTH = 10;
export const API_KEY_CACHE_TTL = 300;
export const TOKEN_CACHE_TTL = 3500;

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Farmer-ID',
  'Access-Control-Max-Age': '86400',
} as const;
