import { getToken } from '../../core/auth/token.ts';
import type { CallToolResult } from '../../types/mcp.ts';
import { DeereApiClient } from './deere-api.ts';
import * as tools from './deere-tools.ts';

export interface DeereRequest {
  method: string;
  params?: { name: string; arguments?: unknown };
}

export interface DeereResponse {
  tools?: typeof tools.toolDefinitions;
  content?: Array<{ type: string; text: string }>;
  error?: { message: string; code: string };
}

/**
 * Handles John Deere MCP requests directly without HTTP.
 * This is the core handler extracted from mcp-john-deere for use in mcp-gateway.
 */
export async function handleDeereRequest(
  body: DeereRequest,
  developerId: string,
  farmerId: string,
): Promise<DeereResponse> {
  const accessToken = await getToken(developerId, farmerId);
  const apiBase =
    Deno.env.get('JOHN_DEERE_API_BASE') ??
    'https://sandboxapi.deere.com/platform';
  const client = new DeereApiClient({
    baseUrl: apiBase,
    accessToken,
  });

  if (body.method === 'tools/list') {
    return { tools: tools.toolDefinitions };
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
        return {
          error: { message: `Unknown tool: ${name}`, code: 'UNKNOWN_TOOL' },
        };
    }

    return result;
  }

  return {
    error: { message: 'Unknown method', code: 'BAD_REQUEST' },
  };
}

// Re-export tool definitions for tools/list aggregation
export { toolDefinitions } from './deere-tools.ts';
