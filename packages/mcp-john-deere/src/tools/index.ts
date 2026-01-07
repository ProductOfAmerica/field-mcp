import type { CallToolResult } from '@agrimcp/types';
import { z } from 'zod';
import type { DeereApiClient } from '../client/deere-api.js';
import * as normalize from '../normalize/responses.js';

export const listOrganizationsSchema = z.object({});
export const listFieldsSchema = z.object({ organizationId: z.string() });
export const getFieldBoundarySchema = z.object({
  organizationId: z.string(),
  fieldId: z.string(),
});
export const getHarvestDataSchema = z.object({
  organizationId: z.string(),
  fieldId: z.string().optional(),
  year: z.number().optional(),
});
export const getPlantingDataSchema = z.object({
  organizationId: z.string(),
  fieldId: z.string().optional(),
  year: z.number().optional(),
});
export const listEquipmentSchema = z.object({ organizationId: z.string() });

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

export const toolDefinitions = [
  {
    name: 'list_organizations',
    description:
      'List all Operations Center organizations the farmer has granted access to.',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'list_fields',
    description: 'List all fields for an organization.',
    inputSchema: {
      type: 'object',
      properties: { organizationId: { type: 'string' } },
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
      },
      required: ['organizationId'],
    },
  },
  {
    name: 'list_equipment',
    description: 'List equipment/machines for an organization.',
    inputSchema: {
      type: 'object',
      properties: { organizationId: { type: 'string' } },
      required: ['organizationId'],
    },
  },
];
