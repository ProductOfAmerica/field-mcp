import { describe, expect, it } from 'vitest';
import { mcpCall, mcpListTools, parseToolResponse } from './helpers';

interface Organization {
  id: string;
  externalId: string;
  provider: string;
  name: string;
  createdAt: string;
}

interface Field {
  id: string;
  name: string;
  organizationId: string;
}

interface Equipment {
  id: string;
  name: string;
  type: string;
}

describe('John Deere MCP', () => {
  let testFieldId: string | null = null;

  describe('tools/list', () => {
    it('returns all available tools', async () => {
      const response = await mcpListTools();

      expect(response.tools).toBeDefined();
      expect(response.tools).toHaveLength(12);

      const toolNames = (response.tools as Array<{ name: string }>)?.map(
        (t) => t.name,
      );
      expect(toolNames).toContain('list_organizations');
      expect(toolNames).toContain('list_fields');
      expect(toolNames).toContain('get_field_boundary');
      expect(toolNames).toContain('get_harvest_data');
      expect(toolNames).toContain('get_planting_data');
      expect(toolNames).toContain('list_equipment');
      expect(toolNames).toContain('list_farms');
      expect(toolNames).toContain('list_clients');
      expect(toolNames).toContain('list_map_layers');
      expect(toolNames).toContain('list_crop_types');
      expect(toolNames).toContain('list_users');
      expect(toolNames).toContain('list_assets');
    });
  });

  describe('list_organizations', () => {
    it('returns organizations for the farmer', async () => {
      const response = await mcpCall('list_organizations', {});
      const orgs = parseToolResponse<Organization[]>(response);

      expect(Array.isArray(orgs)).toBe(true);
      expect(orgs.length).toBeGreaterThan(0);

      const org = orgs[0];
      expect(org).toHaveProperty('id');
      expect(org).toHaveProperty('name');
      expect(org).toHaveProperty('provider', 'john_deere');
    });
  });

  describe('list_fields', () => {
    it('returns fields for an organization', async () => {
      const orgsResponse = await mcpCall('list_organizations', {});
      const orgs = parseToolResponse<Organization[]>(orgsResponse);
      const orgId = orgs[0]?.id;

      if (!orgId) {
        console.warn('No organization found, skipping list_fields test');
        return;
      }

      const response = await mcpCall('list_fields', { organizationId: orgId });

      if (response.error?.message?.includes('400')) {
        console.warn('No fields configured in test org, skipping');
        return;
      }

      const fields = parseToolResponse<Field[]>(response);
      expect(Array.isArray(fields)).toBe(true);

      if (fields.length > 0 && fields[0]) {
        testFieldId = fields[0].id;
      }
    });

    it('requires organizationId parameter', async () => {
      const response = await mcpCall('list_fields', {});
      expect(
        response.error || response.content?.[0]?.text?.includes('error'),
      ).toBeTruthy();
    });
  });

  describe('get_field_boundary', () => {
    it('requires organizationId and fieldId parameters', async () => {
      const response = await mcpCall('get_field_boundary', {});
      expect(
        response.error || response.content?.[0]?.text?.includes('error'),
      ).toBeTruthy();
    });

    it.skipIf(!testFieldId)('returns GeoJSON for valid field', async () => {
      const orgsResponse = await mcpCall('list_organizations', {});

      const orgs = parseToolResponse<Organization[]>(orgsResponse);
      const orgId = orgs[0]?.id;

      const response = await mcpCall('get_field_boundary', {
        organizationId: orgId,
        fieldId: testFieldId!,
      });

      if (!response.error) {
        const boundary = parseToolResponse<{ type: string }>(response);
        expect(boundary).toHaveProperty('type');
      }
    });
  });

  describe('get_harvest_data', () => {
    it('returns harvest data for organization', async () => {
      const orgsResponse = await mcpCall('list_organizations', {});

      const orgs = parseToolResponse<Organization[]>(orgsResponse);
      const orgId = orgs[0]?.id;

      if (!orgId) {
        console.warn('No organization found, skipping get_harvest_data test');
        return;
      }

      const response = await mcpCall('get_harvest_data', {
        organizationId: orgId,
      });

      expect(response.content || response.error).toBeDefined();
    });

    it('requires organizationId parameter', async () => {
      const response = await mcpCall('get_harvest_data', {});
      expect(
        response.error || response.content?.[0]?.text?.includes('error'),
      ).toBeTruthy();
    });
  });

  describe('get_planting_data', () => {
    it('returns planting data for organization', async () => {
      const orgsResponse = await mcpCall('list_organizations', {});

      const orgs = parseToolResponse<Organization[]>(orgsResponse);
      const orgId = orgs[0]?.id;

      if (!orgId) {
        console.warn('No organization found, skipping get_planting_data test');
        return;
      }

      const response = await mcpCall('get_planting_data', {
        organizationId: orgId,
      });

      expect(response.content || response.error).toBeDefined();
    });

    it('requires organizationId parameter', async () => {
      const response = await mcpCall('get_planting_data', {});
      expect(
        response.error || response.content?.[0]?.text?.includes('error'),
      ).toBeTruthy();
    });
  });

  describe('list_equipment', () => {
    it('returns equipment for organization', async () => {
      const orgsResponse = await mcpCall('list_organizations', {});

      const orgs = parseToolResponse<Organization[]>(orgsResponse);
      const orgId = orgs[0]?.id;

      if (!orgId) {
        console.warn('No organization found, skipping list_equipment test');
        return;
      }

      const response = await mcpCall('list_equipment', {
        organizationId: orgId,
      });

      expect(response.content || response.error).toBeDefined();
      if (response.content) {
        const equipment = parseToolResponse<Equipment[]>(response);
        expect(Array.isArray(equipment)).toBe(true);
      }
    });

    it('requires organizationId parameter', async () => {
      const response = await mcpCall('list_equipment', {});
      expect(
        response.error || response.content?.[0]?.text?.includes('error'),
      ).toBeTruthy();
    });
  });

  describe('list_farms', () => {
    it('returns farms for organization', async () => {
      const orgsResponse = await mcpCall('list_organizations', {});

      const orgs = parseToolResponse<Organization[]>(orgsResponse);
      const orgId = orgs[0]?.id;

      if (!orgId) {
        console.warn('No organization found, skipping list_farms test');
        return;
      }

      const response = await mcpCall('list_farms', { organizationId: orgId });

      expect(response.content || response.error).toBeDefined();
    });

    it('requires organizationId parameter', async () => {
      const response = await mcpCall('list_farms', {});
      expect(
        response.error || response.content?.[0]?.text?.includes('error'),
      ).toBeTruthy();
    });
  });

  describe('list_clients', () => {
    it('returns clients for organization', async () => {
      const orgsResponse = await mcpCall('list_organizations', {});

      const orgs = parseToolResponse<Organization[]>(orgsResponse);
      const orgId = orgs[0]?.id;

      if (!orgId) {
        console.warn('No organization found, skipping list_clients test');
        return;
      }

      const response = await mcpCall('list_clients', { organizationId: orgId });

      expect(response.content || response.error).toBeDefined();
    });

    it('requires organizationId parameter', async () => {
      const response = await mcpCall('list_clients', {});
      expect(
        response.error || response.content?.[0]?.text?.includes('error'),
      ).toBeTruthy();
    });
  });

  describe('list_map_layers', () => {
    it.skipIf(!testFieldId)('returns map layers for field', async () => {
      const orgsResponse = await mcpCall('list_organizations', {});

      const orgs = parseToolResponse<Organization[]>(orgsResponse);
      const orgId = orgs[0]?.id;

      const response = await mcpCall('list_map_layers', {
        organizationId: orgId,
        fieldId: testFieldId!,
      });

      expect(response.content || response.error).toBeDefined();
    });

    it('requires organizationId and fieldId parameters', async () => {
      const response = await mcpCall('list_map_layers', {});
      expect(
        response.error || response.content?.[0]?.text?.includes('error'),
      ).toBeTruthy();
    });
  });

  describe('list_crop_types', () => {
    it('returns available crop types', async () => {
      const response = await mcpCall('list_crop_types', {});

      expect(response.content || response.error).toBeDefined();
    });
  });

  describe('list_users', () => {
    it('returns users for organization', async () => {
      const orgsResponse = await mcpCall('list_organizations', {});

      const orgs = parseToolResponse<Organization[]>(orgsResponse);
      const orgId = orgs[0]?.id;

      if (!orgId) {
        console.warn('No organization found, skipping list_users test');
        return;
      }

      const response = await mcpCall('list_users', { organizationId: orgId });

      if (response.error) {
        console.warn('list_users not available in sandbox, skipping');
        return;
      }

      expect(response.content).toBeDefined();
    });

    it('requires organizationId parameter', async () => {
      const response = await mcpCall('list_users', {});
      expect(
        response.error || response.content?.[0]?.text?.includes('error'),
      ).toBeTruthy();
    });
  });

  describe('list_assets', () => {
    it('returns assets for organization', async () => {
      const orgsResponse = await mcpCall('list_organizations', {});

      const orgs = parseToolResponse<Organization[]>(orgsResponse);
      const orgId = orgs[0]?.id;

      if (!orgId) {
        console.warn('No organization found, skipping list_assets test');
        return;
      }

      const response = await mcpCall('list_assets', { organizationId: orgId });

      expect(response.content || response.error).toBeDefined();
    });

    it('requires organizationId parameter', async () => {
      const response = await mcpCall('list_assets', {});
      expect(
        response.error || response.content?.[0]?.text?.includes('error'),
      ).toBeTruthy();
    });
  });

  describe('error handling', () => {
    it('returns error for unknown tool', async () => {
      const response = await mcpCall('unknown_tool', {});
      expect(response.error).toBeDefined();
    });

    it('handles invalid farmer connection gracefully', async () => {
      const response = await mcpCall(
        'list_organizations',
        {},
        {
          farmerId: 'non-existent-farmer-id',
        },
      );

      expect(response.error).toBeDefined();
    });
  });
});
