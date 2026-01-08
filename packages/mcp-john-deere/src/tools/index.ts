import type { CallToolResult } from '@fieldmcp/types';
import { z } from 'zod';
import type { DeereApiClient } from '../client/deere-api.js';
import * as normalize from '../normalize/responses.js';

function stripControlChars(s: string): string {
  return s
    .split('')
    .filter((c) => c.charCodeAt(0) >= 0x20)
    .join('');
}

const safeId = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[\w\-:.]+$/, 'Invalid ID format')
  .transform(stripControlChars);

const safeIdOptional = z
  .string()
  .max(128)
  .regex(/^[\w\-:.]*$/, 'Invalid ID format')
  .transform(stripControlChars)
  .optional();

const providerSchema = z.enum(['john_deere', 'climate', 'cnhi']).optional();

export const listOrganizationsSchema = z.object({
  provider: providerSchema,
});
export const listFieldsSchema = z.object({
  organizationId: safeId,
  provider: providerSchema,
});
export const getFieldBoundarySchema = z.object({
  organizationId: safeId,
  fieldId: safeId,
  provider: providerSchema,
});
export const getHarvestDataSchema = z.object({
  organizationId: safeId,
  fieldId: safeIdOptional,
  year: z.number().int().min(1900).max(2100).optional(),
  provider: providerSchema,
});
export const getPlantingDataSchema = z.object({
  organizationId: safeId,
  fieldId: safeIdOptional,
  year: z.number().int().min(1900).max(2100).optional(),
  provider: providerSchema,
});
export const listEquipmentSchema = z.object({
  organizationId: safeId,
  provider: providerSchema,
});
export const listFarmsSchema = z.object({
  organizationId: safeId,
  provider: providerSchema,
});
export const listClientsSchema = z.object({
  organizationId: safeId,
  provider: providerSchema,
});
export const listMapLayersSchema = z.object({
  organizationId: safeId,
  fieldId: safeId,
  provider: providerSchema,
});
export const listCropTypesSchema = z.object({
  provider: providerSchema,
});
export const listUsersSchema = z.object({
  organizationId: safeId,
  provider: providerSchema,
});
export const listAssetsSchema = z.object({
  organizationId: safeId,
  provider: providerSchema,
});

export async function listOrganizations(
  _: unknown,
  client: DeereApiClient,
): Promise<CallToolResult> {
  const response = await client.getOrganizations();
  const orgs = response.values.map(normalize.normalizeOrganization);
  return { content: [{ type: 'text', text: JSON.stringify(orgs, null, 2) }] };
}

export async function listFields(
  input: z.infer<typeof listFieldsSchema>,
  client: DeereApiClient,
): Promise<CallToolResult> {
  const response = await client.getFields(input.organizationId);
  const fields = response.values.map((f) =>
    normalize.normalizeField(f, input.organizationId),
  );
  return { content: [{ type: 'text', text: JSON.stringify(fields, null, 2) }] };
}

export async function getFieldBoundary(
  input: z.infer<typeof getFieldBoundarySchema>,
  client: DeereApiClient,
): Promise<CallToolResult> {
  const field = await client.getFieldBoundary(
    input.organizationId,
    input.fieldId,
  );
  const normalized = normalize.normalizeField(field, input.organizationId);
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            fieldId: normalized.externalId,
            name: normalized.name,
            acres: normalized.acres,
            boundaryGeoJson: normalized.boundaryGeoJson,
          },
          null,
          2,
        ),
      },
    ],
  };
}

export async function getHarvestData(
  input: z.infer<typeof getHarvestDataSchema>,
  client: DeereApiClient,
): Promise<CallToolResult> {
  const response = await client.getFieldOperations(input.organizationId, {
    fieldId: input.fieldId,
    operationType: 'harvested',
    startDate: input.year ? `${input.year}-01-01` : undefined,
    endDate: input.year ? `${input.year}-12-31` : undefined,
  });
  const harvests = response.values
    .map((op) =>
      normalize.normalizeHarvestOperation(op, input.fieldId || 'unknown'),
    )
    .filter(Boolean);
  return {
    content: [{ type: 'text', text: JSON.stringify(harvests, null, 2) }],
  };
}

export async function getPlantingData(
  input: z.infer<typeof getPlantingDataSchema>,
  client: DeereApiClient,
): Promise<CallToolResult> {
  const response = await client.getFieldOperations(input.organizationId, {
    fieldId: input.fieldId,
    operationType: 'seeded',
    startDate: input.year ? `${input.year}-01-01` : undefined,
    endDate: input.year ? `${input.year}-12-31` : undefined,
  });
  const plantings = response.values
    .map((op) =>
      normalize.normalizePlantingOperation(op, input.fieldId || 'unknown'),
    )
    .filter(Boolean);
  return {
    content: [{ type: 'text', text: JSON.stringify(plantings, null, 2) }],
  };
}

export async function listEquipment(
  input: z.infer<typeof listEquipmentSchema>,
  client: DeereApiClient,
): Promise<CallToolResult> {
  const response = await client.getMachines(input.organizationId);
  const equipment = response.values.map((m) =>
    normalize.normalizeEquipment(m, input.organizationId),
  );
  return {
    content: [{ type: 'text', text: JSON.stringify(equipment, null, 2) }],
  };
}

export async function listFarms(
  input: z.infer<typeof listFarmsSchema>,
  client: DeereApiClient,
): Promise<CallToolResult> {
  const response = await client.getFarms(input.organizationId);
  const farms = response.values.map((f) =>
    normalize.normalizeFarm(f, input.organizationId),
  );
  return {
    content: [{ type: 'text', text: JSON.stringify(farms, null, 2) }],
  };
}

export async function listClients(
  input: z.infer<typeof listClientsSchema>,
  client: DeereApiClient,
): Promise<CallToolResult> {
  const response = await client.getClients(input.organizationId);
  const clients = response.values.map((c) =>
    normalize.normalizeClient(c, input.organizationId),
  );
  return {
    content: [{ type: 'text', text: JSON.stringify(clients, null, 2) }],
  };
}

export async function listMapLayers(
  input: z.infer<typeof listMapLayersSchema>,
  client: DeereApiClient,
): Promise<CallToolResult> {
  const response = await client.getMapLayers(
    input.organizationId,
    input.fieldId,
  );
  const layers = response.values.map((l) =>
    normalize.normalizeMapLayer(l, input.fieldId),
  );
  return {
    content: [{ type: 'text', text: JSON.stringify(layers, null, 2) }],
  };
}

export async function listCropTypes(
  _: unknown,
  client: DeereApiClient,
): Promise<CallToolResult> {
  const response = await client.getCropTypes();
  const cropTypes = response.values.map(normalize.normalizeCropType);
  return {
    content: [{ type: 'text', text: JSON.stringify(cropTypes, null, 2) }],
  };
}

export async function listUsers(
  input: z.infer<typeof listUsersSchema>,
  client: DeereApiClient,
): Promise<CallToolResult> {
  const response = await client.getUsers(input.organizationId);
  const users = response.values.map((u) =>
    normalize.normalizeUser(u, input.organizationId),
  );
  return {
    content: [{ type: 'text', text: JSON.stringify(users, null, 2) }],
  };
}

export async function listAssets(
  input: z.infer<typeof listAssetsSchema>,
  client: DeereApiClient,
): Promise<CallToolResult> {
  const response = await client.getAssets(input.organizationId);
  const assets = response.values.map((a) =>
    normalize.normalizeAsset(a, input.organizationId),
  );
  return {
    content: [{ type: 'text', text: JSON.stringify(assets, null, 2) }],
  };
}

const providerProperty = {
  type: 'string',
  enum: ['john_deere', 'climate', 'cnhi'],
  description: 'Provider to use. Optional if only one provider is connected.',
};

export const toolDefinitions = [
  {
    name: 'list_organizations',
    description:
      'List all Operations Center organizations the farmer has granted access to.',
    inputSchema: {
      type: 'object',
      properties: { provider: providerProperty },
      required: [],
    },
  },
  {
    name: 'list_fields',
    description: 'List all fields for an organization.',
    inputSchema: {
      type: 'object',
      properties: {
        organizationId: { type: 'string' },
        provider: providerProperty,
      },
      required: ['organizationId'],
    },
  },
  {
    name: 'get_field_boundary',
    description: 'Get GeoJSON boundary for a field.',
    inputSchema: {
      type: 'object',
      properties: {
        organizationId: { type: 'string' },
        fieldId: { type: 'string' },
        provider: providerProperty,
      },
      required: ['organizationId', 'fieldId'],
    },
  },
  {
    name: 'get_harvest_data',
    description: 'Get harvest/yield data for fields.',
    inputSchema: {
      type: 'object',
      properties: {
        organizationId: { type: 'string' },
        fieldId: { type: 'string' },
        year: { type: 'number' },
        provider: providerProperty,
      },
      required: ['organizationId'],
    },
  },
  {
    name: 'get_planting_data',
    description: 'Get planting data for fields.',
    inputSchema: {
      type: 'object',
      properties: {
        organizationId: { type: 'string' },
        fieldId: { type: 'string' },
        year: { type: 'number' },
        provider: providerProperty,
      },
      required: ['organizationId'],
    },
  },
  {
    name: 'list_equipment',
    description: 'List equipment/machines for an organization.',
    inputSchema: {
      type: 'object',
      properties: {
        organizationId: { type: 'string' },
        provider: providerProperty,
      },
      required: ['organizationId'],
    },
  },
  {
    name: 'list_farms',
    description: 'List all farms for an organization.',
    inputSchema: {
      type: 'object',
      properties: {
        organizationId: { type: 'string' },
        provider: providerProperty,
      },
      required: ['organizationId'],
    },
  },
  {
    name: 'list_clients',
    description: 'List all clients for an organization.',
    inputSchema: {
      type: 'object',
      properties: {
        organizationId: { type: 'string' },
        provider: providerProperty,
      },
      required: ['organizationId'],
    },
  },
  {
    name: 'list_map_layers',
    description:
      'List map layers for a field (yield maps, prescriptions, etc.).',
    inputSchema: {
      type: 'object',
      properties: {
        organizationId: { type: 'string' },
        fieldId: { type: 'string' },
        provider: providerProperty,
      },
      required: ['organizationId', 'fieldId'],
    },
  },
  {
    name: 'list_crop_types',
    description: 'List all available crop types.',
    inputSchema: {
      type: 'object',
      properties: { provider: providerProperty },
      required: [],
    },
  },
  {
    name: 'list_users',
    description: 'List all users in an organization.',
    inputSchema: {
      type: 'object',
      properties: {
        organizationId: { type: 'string' },
        provider: providerProperty,
      },
      required: ['organizationId'],
    },
  },
  {
    name: 'list_assets',
    description: 'List all assets for an organization.',
    inputSchema: {
      type: 'object',
      properties: {
        organizationId: { type: 'string' },
        provider: providerProperty,
      },
      required: ['organizationId'],
    },
  },
];
