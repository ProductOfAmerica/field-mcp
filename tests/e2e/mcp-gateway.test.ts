import { describe, expect, it } from 'vitest';
import { mcpListTools, rawRequest, TEST_CONFIG } from './helpers';

describe('MCP Gateway', () => {
  describe('authentication', () => {
    it('accepts valid API key', async () => {
      const response = await mcpListTools();
      expect(response.tools).toBeDefined();
      expect(response.error).toBeUndefined();
    });

    it('rejects missing API key', async () => {
      const response = await rawRequest('', {
        headers: {
          'X-Farmer-ID': TEST_CONFIG.FARMER_ID,
        },
        body: { jsonrpc: '2.0', id: 1, method: 'tools/list' },
      });

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json.error.code).toBe('UNAUTHORIZED');
    });

    it('rejects invalid API key', async () => {
      const response = await rawRequest('', {
        headers: {
          Authorization: 'Bearer field_live_invalid_key_here_12345678',
          'X-Farmer-ID': TEST_CONFIG.FARMER_ID,
        },
        body: { jsonrpc: '2.0', id: 1, method: 'tools/list' },
      });

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json.error.code).toBe('UNAUTHORIZED');
    });

    it('rejects malformed API key prefix', async () => {
      const response = await rawRequest('', {
        headers: {
          Authorization: 'Bearer wrong_prefix_key_here',
          'X-Farmer-ID': TEST_CONFIG.FARMER_ID,
        },
        body: { jsonrpc: '2.0', id: 1, method: 'tools/list' },
      });

      expect(response.status).toBe(401);
    });
  });

  describe('farmer ID header', () => {
    it('rejects missing X-Farmer-ID header', async () => {
      const response = await rawRequest('', {
        headers: {
          Authorization: `Bearer ${TEST_CONFIG.API_KEY}`,
        },
        body: { jsonrpc: '2.0', id: 1, method: 'tools/list' },
      });

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error.message).toContain('X-Farmer-ID');
    });
  });

  describe('routing', () => {
    it('returns 404 for invalid path', async () => {
      const response = await rawRequest('/invalid', {
        headers: {
          Authorization: `Bearer ${TEST_CONFIG.API_KEY}`,
          'X-Farmer-ID': TEST_CONFIG.FARMER_ID,
        },
        body: { jsonrpc: '2.0', id: 1, method: 'tools/list' },
      });

      expect(response.status).toBe(404);
    });

    it('returns 404 for old provider-specific endpoints', async () => {
      const response = await rawRequest('/mcp-gateway/john-deere', {
        headers: {
          Authorization: `Bearer ${TEST_CONFIG.API_KEY}`,
          'X-Farmer-ID': TEST_CONFIG.FARMER_ID,
        },
        body: { jsonrpc: '2.0', id: 1, method: 'tools/list' },
      });

      expect(response.status).toBe(404);
    });
  });

  describe('rate limiting headers', () => {
    it('includes rate limit headers in response', async () => {
      const response = await rawRequest('', {
        headers: {
          Authorization: `Bearer ${TEST_CONFIG.API_KEY}`,
          'X-Farmer-ID': TEST_CONFIG.FARMER_ID,
        },
        body: { jsonrpc: '2.0', id: 1, method: 'tools/list' },
      });

      expect(response.headers.get('X-RateLimit-Remaining')).toBeDefined();
    });
  });
});
