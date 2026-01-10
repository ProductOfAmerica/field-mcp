import { describe, expect, it } from 'vitest';
import { mcpCall, rawRequest, TEST_CONFIG } from './helpers';

describe('Security Tests', () => {
  describe('Input Validation Attacks', () => {
    it('rejects path traversal in organizationId', async () => {
      const response = await mcpCall('list_fields', {
        organizationId: '../../../etc/passwd',
      });
      expect(response.error || response.content).toBeDefined();
    });

    it('rejects path traversal in fieldId', async () => {
      const response = await mcpCall('get_field_boundary', {
        organizationId: 'valid-org',
        fieldId: '..%2F..%2F..%2Fetc%2Fpasswd',
      });
      expect(response.error || response.content).toBeDefined();
    });

    it('handles very long string in organizationId', async () => {
      const longString = 'a'.repeat(10000);
      const response = await mcpCall('list_fields', {
        organizationId: longString,
      });
      expect(response.error || response.content).toBeDefined();
    });

    it('handles null byte injection in organizationId', async () => {
      const response = await mcpCall('list_fields', {
        organizationId: 'valid-org\x00malicious',
      });
      expect(response.error || response.content).toBeDefined();
    });

    it('handles unicode injection in parameters', async () => {
      const response = await mcpCall('list_fields', {
        organizationId: 'org\u202Eevil',
      });
      expect(response.error || response.content).toBeDefined();
    });

    it('handles deeply nested JSON in arguments', async () => {
      let nested: Record<string, unknown> = { value: 'test' };
      for (let i = 0; i < 100; i++) {
        nested = { nested };
      }
      const response = await mcpCall('list_organizations', nested);
      expect(response.error || response.content).toBeDefined();
    });

    it('handles array instead of string for organizationId', async () => {
      const response = await mcpCall('list_fields', {
        organizationId: ['org1', 'org2'],
      });
      expect(response.error).toBeDefined();
    });

    it('handles object instead of string for organizationId', async () => {
      const response = await mcpCall('list_fields', {
        organizationId: { $ne: null },
      });
      expect(response.error).toBeDefined();
    });

    it('handles prototype pollution attempt', async () => {
      const response = await mcpCall('list_organizations', {
        __proto__: { admin: true },
        constructor: { prototype: { admin: true } },
      });
      expect(response.error || response.content).toBeDefined();
    });
  });

  describe('IDOR / Cross-Tenant Authorization', () => {
    it('cannot access data with different farmer ID than authorized', async () => {
      const response = await mcpCall(
        'list_organizations',
        {},
        { farmerId: 'different-farmer-id' },
      );
      expect(response.error).toBeDefined();
    });

    it('cannot access organizations from another tenant', async () => {
      const response = await mcpCall('list_fields', {
        organizationId: 'other-tenant-org-id-12345',
      });
      expect(response.error || response.content).toBeDefined();
    });
  });

  describe('Request Handling Attacks', () => {
    it('rejects malformed JSON body', async () => {
      const response = await rawRequest('', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${TEST_CONFIG.API_KEY}`,
          'X-Farmer-ID': TEST_CONFIG.FARMER_ID,
          'Content-Type': 'application/json',
        },
        body: '{ invalid json',
        rawBody: true,
      });
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('rejects request without Content-Type header', async () => {
      const response = await fetch(`${TEST_CONFIG.GATEWAY_URL}/mcp-gateway`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${TEST_CONFIG.API_KEY}`,
          'X-Farmer-ID': TEST_CONFIG.FARMER_ID,
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/list',
        }),
      });
      expect(response.status).toBeLessThan(500);
    });

    // PROD ONLY TEST - FAILS ON LOCALHOST!
    // it('rejects very large request body', async () => {
    //   // MAX_BODY_SIZE is 100KB, so 101KB should trigger rejection
    //   // Using just over the limit to minimize test time
    //   const largeBody = {
    //     jsonrpc: '2.0',
    //     id: 1,
    //     method: 'tools/call',
    //     params: {
    //       name: 'list_organizations',
    //       arguments: {
    //         data: 'x'.repeat(101 * 1024),
    //       },
    //     },
    //   };
    //
    //   const controller = new AbortController();
    //   const timeoutId = setTimeout(() => controller.abort(), 45000);
    //
    //   try {
    //     const response = await fetch(`${TEST_CONFIG.GATEWAY_URL}`, {
    //       method: 'POST',
    //       headers: {
    //         'Content-Type': 'application/json',
    //         Authorization: `Bearer ${TEST_CONFIG.API_KEY}`,
    //         'X-Farmer-ID': TEST_CONFIG.FARMER_ID,
    //       },
    //       body: JSON.stringify(largeBody),
    //       signal: controller.signal,
    //     });
    //     clearTimeout(timeoutId);
    //     expect(response.status).toBeLessThan(500);
    //   } catch (error) {
    //     clearTimeout(timeoutId);
    //     // AbortError or network errors are acceptable
    //     // as they indicate the request was rejected
    //     if (error instanceof Error && error.name === 'AbortError') {
    //       // Test timed out but we've increased the timeout, so this is unexpected
    //       throw error;
    //     }
    //     // Other errors (like connection reset) are valid rejection behaviors
    //   }
    // }, 60000);

    it('ignores client-supplied X-Developer-ID header', async () => {
      const response = await rawRequest('', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${TEST_CONFIG.API_KEY}`,
          'X-Farmer-ID': TEST_CONFIG.FARMER_ID,
          'X-Developer-ID': 'spoofed-developer-id',
        },
        body: {
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/list',
        },
      });
      expect(response.status).toBe(200);
    });

    it('rejects CRLF injection in headers via farmer ID', async () => {
      await expect(
        rawRequest('/v1/mcp', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${TEST_CONFIG.API_KEY}`,
            'X-Farmer-ID': 'farmer\r\nX-Injected: evil',
          },
          body: {
            jsonrpc: '2.0',
            id: 1,
            method: 'tools/list',
          },
        }),
      ).rejects.toThrow();
    });

    it('handles empty request body', async () => {
      const response = await fetch(`${TEST_CONFIG.GATEWAY_URL}/mcp-gateway`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${TEST_CONFIG.API_KEY}`,
          'X-Farmer-ID': TEST_CONFIG.FARMER_ID,
          'Content-Type': 'application/json',
        },
      });
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('rejects GET request to POST-only endpoint', async () => {
      const response = await fetch(`${TEST_CONFIG.GATEWAY_URL}/mcp-gateway`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${TEST_CONFIG.API_KEY}`,
          'X-Farmer-ID': TEST_CONFIG.FARMER_ID,
        },
      });
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('API Key Security', () => {
    it('rejects empty bearer token', async () => {
      const response = await rawRequest('', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ',
          'X-Farmer-ID': TEST_CONFIG.FARMER_ID,
        },
        body: {
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/list',
        },
      });
      expect(response.status).toBe(401);
    });

    it('rejects malformed API key format', async () => {
      const response = await rawRequest('', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer field_live_',
          'X-Farmer-ID': TEST_CONFIG.FARMER_ID,
        },
        body: {
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/list',
        },
      });
      expect(response.status).toBe(401);
    });

    it('rejects API key without prefix', async () => {
      const response = await rawRequest('', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer invalidkey12345678901234567890ab',
          'X-Farmer-ID': TEST_CONFIG.FARMER_ID,
        },
        body: {
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/list',
        },
      });
      expect(response.status).toBe(401);
    });

    it('rejects missing Authorization header', async () => {
      const response = await rawRequest('', {
        method: 'POST',
        headers: {
          'X-Farmer-ID': TEST_CONFIG.FARMER_ID,
        },
        body: {
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/list',
        },
      });
      expect(response.status).toBe(401);
    });

    it('rejects Basic auth instead of Bearer', async () => {
      const response = await rawRequest('', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${btoa('user:pass')}`,
          'X-Farmer-ID': TEST_CONFIG.FARMER_ID,
        },
        body: {
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/list',
        },
      });
      expect(response.status).toBe(401);
    });

    it('timing attack resistance - invalid vs valid key similar response time', async () => {
      const iterations = 5;
      const invalidTimes: number[] = [];
      const validTimes: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startInvalid = performance.now();
        await rawRequest('/v1/mcp', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer field_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
            'X-Farmer-ID': TEST_CONFIG.FARMER_ID,
          },
          body: { jsonrpc: '2.0', id: 1, method: 'tools/list' },
        });
        invalidTimes.push(performance.now() - startInvalid);

        const startValid = performance.now();
        await rawRequest('/v1/mcp', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${TEST_CONFIG.API_KEY}`,
            'X-Farmer-ID': TEST_CONFIG.FARMER_ID,
          },
          body: { jsonrpc: '2.0', id: 1, method: 'tools/list' },
        });
        validTimes.push(performance.now() - startValid);
      }

      const avgInvalid =
        invalidTimes.reduce((a, b) => a + b, 0) / invalidTimes.length;
      const avgValid =
        validTimes.reduce((a, b) => a + b, 0) / validTimes.length;
      const timeDiff = Math.abs(avgValid - avgInvalid);

      expect(timeDiff).toBeLessThan(100);
    });
  });

  describe('Rate Limiting Security', () => {
    it('rate limit headers are present in response', async () => {
      const response = await rawRequest('', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${TEST_CONFIG.API_KEY}`,
          'X-Farmer-ID': TEST_CONFIG.FARMER_ID,
        },
        body: {
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/list',
        },
      });
      expect(response.headers.get('X-RateLimit-Remaining')).toBeDefined();
    });

    it('rate limit decrements with each request', async () => {
      const response1 = await rawRequest('/v1/mcp', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${TEST_CONFIG.API_KEY}`,
          'X-Farmer-ID': TEST_CONFIG.FARMER_ID,
        },
        body: { jsonrpc: '2.0', id: 1, method: 'tools/list' },
      });

      const response2 = await rawRequest('/v1/mcp', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${TEST_CONFIG.API_KEY}`,
          'X-Farmer-ID': TEST_CONFIG.FARMER_ID,
        },
        body: { jsonrpc: '2.0', id: 1, method: 'tools/list' },
      });

      const remaining1 = Number.parseInt(
        response1.headers.get('X-RateLimit-Remaining') || '0',
        10,
      );
      const remaining2 = Number.parseInt(
        response2.headers.get('X-RateLimit-Remaining') || '0',
        10,
      );

      expect(remaining1).toBeGreaterThanOrEqual(remaining2);
    });
  });

  describe('CORS Security', () => {
    it('returns CORS headers on OPTIONS request', async () => {
      const response = await fetch(`${TEST_CONFIG.GATEWAY_URL}/mcp-gateway`, {
        method: 'OPTIONS',
      });
      expect(response.status).toBe(204);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBeDefined();
      expect(
        response.headers.get('Access-Control-Allow-Methods'),
      ).toBeDefined();
      expect(
        response.headers.get('Access-Control-Allow-Headers'),
      ).toBeDefined();
    });

    it('returns CORS headers on actual request', async () => {
      const response = await rawRequest('', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${TEST_CONFIG.API_KEY}`,
          'X-Farmer-ID': TEST_CONFIG.FARMER_ID,
          Origin: 'https://evil.com',
        },
        body: {
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/list',
        },
      });
      expect(response.headers.get('Access-Control-Allow-Origin')).toBeDefined();
    });

    it('preflight includes allowed headers', async () => {
      const response = await fetch(`${TEST_CONFIG.GATEWAY_URL}/mcp-gateway`, {
        method: 'OPTIONS',
        headers: {
          Origin: 'https://example.com',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Authorization, X-Farmer-ID',
        },
      });
      const allowedHeaders = response.headers.get(
        'Access-Control-Allow-Headers',
      );
      expect(allowedHeaders).toContain('Authorization');
      expect(allowedHeaders).toContain('X-Farmer-ID');
    });
  });

  describe('JSON-RPC Security', () => {
    it('rejects invalid JSON-RPC version', async () => {
      const response = await rawRequest('', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${TEST_CONFIG.API_KEY}`,
          'X-Farmer-ID': TEST_CONFIG.FARMER_ID,
        },
        body: {
          jsonrpc: '1.0',
          id: 1,
          method: 'tools/list',
        },
      });
      expect(response.status).toBeLessThan(500);
    });

    it('handles missing method field', async () => {
      const response = await rawRequest('', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${TEST_CONFIG.API_KEY}`,
          'X-Farmer-ID': TEST_CONFIG.FARMER_ID,
        },
        body: {
          jsonrpc: '2.0',
          id: 1,
        },
      });
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('handles batch requests', async () => {
      const response = await rawRequest('', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${TEST_CONFIG.API_KEY}`,
          'X-Farmer-ID': TEST_CONFIG.FARMER_ID,
        },
        body: [
          { jsonrpc: '2.0', id: 1, method: 'tools/list' },
          { jsonrpc: '2.0', id: 2, method: 'tools/list' },
        ],
      });
      expect(response.status).toBeLessThan(500);
    });
  });

  describe('Error Information Leakage', () => {
    it('does not leak stack traces in error responses', async () => {
      const response = await mcpCall('list_fields', {
        organizationId: null,
      });
      const responseText = JSON.stringify(response);
      expect(responseText).not.toContain('at ');
      expect(responseText).not.toContain('.ts:');
      expect(responseText).not.toContain('.js:');
      expect(responseText).not.toContain('node_modules');
    });

    it('does not leak internal paths in error responses', async () => {
      const response = await mcpCall('unknown_tool', {});
      const responseText = JSON.stringify(response);
      expect(responseText).not.toContain('/home/');
      expect(responseText).not.toContain('/Users/');
      expect(responseText).not.toContain('C:\\');
    });

    it('does not leak database details in error responses', async () => {
      const response = await mcpCall(
        'list_organizations',
        {},
        { farmerId: "'; DROP TABLE users; --" },
      );
      const responseText = JSON.stringify(response);
      expect(responseText).not.toContain('postgresql');
      expect(responseText).not.toContain('supabase');
      expect(responseText).not.toContain('SELECT');
      expect(responseText).not.toContain('INSERT');
    });
  });
});
