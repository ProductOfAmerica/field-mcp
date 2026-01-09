import { getToken } from '../_shared/token.ts';
import { DeereApiClient } from '../_shared/deere-api.ts';
import * as tools from '../_shared/deere-tools.ts';

interface CallToolResult {
  content: Array<{ type: string; text: string }>;
}

Deno.serve(async (request: Request): Promise<Response> => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }

  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({
        error: { message: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' },
      }),
      { status: 405, headers: { 'Content-Type': 'application/json' } },
    );
  }

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

  if (developerId.length > 128 || farmerId.length > 128) {
    return new Response(
      JSON.stringify({
        error: { message: 'Invalid header value', code: 'BAD_REQUEST' },
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  try {
    const accessToken = await getToken(developerId, farmerId);
    const apiBase = Deno.env.get('JOHN_DEERE_API_BASE') ?? 'https://sandboxapi.deere.com/platform';
    const client = new DeereApiClient({
      baseUrl: apiBase,
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
        case 'list_farms':
          result = await tools.listFarms(
            tools.listFarmsSchema.parse(args),
            client,
          );
          break;
        case 'list_clients':
          result = await tools.listClients(
            tools.listClientsSchema.parse(args),
            client,
          );
          break;
        case 'list_map_layers':
          result = await tools.listMapLayers(
            tools.listMapLayersSchema.parse(args),
            client,
          );
          break;
        case 'list_crop_types':
          result = await tools.listCropTypes(args, client);
          break;
        case 'list_users':
          result = await tools.listUsers(
            tools.listUsersSchema.parse(args),
            client,
          );
          break;
        case 'list_assets':
          result = await tools.listAssets(
            tools.listAssetsSchema.parse(args),
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
    console.error('[error] john-deere:', error);
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
});
