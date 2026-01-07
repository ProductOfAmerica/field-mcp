import type { CallToolResult } from '@agrimcp/types';
import { getToken } from './auth/token.js';
import { DeereApiClient } from './client/deere-api.js';
import * as tools from './tools/index.js';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  TOKEN_CACHE: KVNamespace;
  JOHN_DEERE_CLIENT_ID: string;
  JOHN_DEERE_CLIENT_SECRET: string;
  JOHN_DEERE_API_BASE: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const developerId = request.headers.get('X-Developer-ID');
    const farmerId = request.headers.get('X-Farmer-ID');

    if (!developerId || !farmerId) {
      return new Response(
        JSON.stringify({
          error: { message: 'Missing context headers', code: 'BAD_REQUEST' },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    try {
      const accessToken = await getToken(developerId, farmerId, env);
      const client = new DeereApiClient({
        baseUrl: env.JOHN_DEERE_API_BASE,
        accessToken,
      });
      const body = (await request.json()) as {
        method: string;
        params?: { name: string; arguments?: unknown };
      };

      if (body.method === 'tools/list') {
        return new Response(JSON.stringify({ tools: tools.toolDefinitions }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (body.method === 'tools/call' && body.params) {
        const { name, arguments: args } = body.params;
        let result: CallToolResult;

        switch (name) {
          case 'list_organizations':
            result = await tools.listOrganizations(args, client);
            break;
          case 'list_fields':
            result = await tools.listFields(
              tools.listFieldsSchema.parse(args),
              client,
            );
            break;
          case 'get_field_boundary':
            result = await tools.getFieldBoundary(
              tools.getFieldBoundarySchema.parse(args),
              client,
            );
            break;
          case 'get_harvest_data':
            result = await tools.getHarvestData(
              tools.getHarvestDataSchema.parse(args),
              client,
            );
            break;
          case 'get_planting_data':
            result = await tools.getPlantingData(
              tools.getPlantingDataSchema.parse(args),
              client,
            );
            break;
          case 'list_equipment':
            result = await tools.listEquipment(
              tools.listEquipmentSchema.parse(args),
              client,
            );
            break;
          default:
            throw new Error(`Unknown tool: ${name}`);
        }

        return new Response(JSON.stringify(result), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(
        JSON.stringify({
          error: { message: 'Unknown method', code: 'BAD_REQUEST' },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    } catch (error) {
      console.error('John Deere MCP error:', error);
      return new Response(
        JSON.stringify({
          error: {
            message: error instanceof Error ? error.message : 'Internal error',
            code: 'INTERNAL_ERROR',
          },
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }
  },
};
