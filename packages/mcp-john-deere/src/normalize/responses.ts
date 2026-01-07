import type {
  Equipment,
  Field,
  GeoJsonPolygon,
  HarvestRecord,
  JDBoundary,
  JDField,
  JDFieldOperation,
  JDMachine,
  JDOrganization,
  Organization,
  PlantingRecord,
} from '@agrimcp/types';

export function normalizeOrganization(jd: JDOrganization): Organization {
  return {
    id: crypto.randomUUID(),
    externalId: jd.id,
    provider: 'john_deere',
    name: jd.name,
    createdAt: new Date().toISOString(),
  };
}

export function normalizeField(jd: JDField, organizationId: string): Field {
  const boundary = jd.boundaries?.[0];

  return {
    id: crypto.randomUUID(),
    externalId: jd.id,
    provider: 'john_deere',
    organizationId,
    name: jd.name,
    acres: boundary?.area?.value ?? 0,
    boundaryGeoJson: boundary ? convertBoundaryToGeoJson(boundary) : undefined,
    activeCrop: jd.activeCrop,
  };
}

function convertBoundaryToGeoJson(boundary: JDBoundary): GeoJsonPolygon {
  const polygon = boundary.multipolygons?.[0];
  if (!polygon) return { type: 'Polygon', coordinates: [] };

  return {
    type: 'Polygon',
    coordinates: polygon.rings.map((ring) =>
      ring.points.map((p) => [p.lon, p.lat]),
    ),
  };
}

export function normalizeHarvestOperation(
  jd: JDFieldOperation,
  fieldId: string,
): HarvestRecord | null {
  if (jd.operationType !== 'harvested') return null;
  return {
    id: crypto.randomUUID(),
    fieldId,
    date: jd.startDate,
    crop: 'Unknown',
    yieldPerAcre: 0,
    yieldUnit: 'bu',
    totalArea: jd.area?.value ?? 0,
  };
}

export function normalizePlantingOperation(
  jd: JDFieldOperation,
  fieldId: string,
): PlantingRecord | null {
  if (jd.operationType !== 'seeded') return null;
  return {
    id: crypto.randomUUID(),
    fieldId,
    date: jd.startDate,
    crop: 'Unknown',
    variety: 'Unknown',
    populationPerAcre: 0,
    totalArea: jd.area?.value ?? 0,
  };
}

export function normalizeEquipment(
  jd: JDMachine,
  organizationId: string,
): Equipment {
  const typeMap: Record<string, Equipment['type']> = {
    Tractor: 'tractor',
    Combine: 'combine',
    Sprayer: 'sprayer',
    Planter: 'planter',
  };
  return {
    id: crypto.randomUUID(),
    externalId: jd.id,
    provider: 'john_deere',
    organizationId,
    name: jd.name,
    type: typeMap[jd.machineType] || 'other',
    make: jd.make,
    model: jd.model,
    year: jd.modelYear,
  };
}
