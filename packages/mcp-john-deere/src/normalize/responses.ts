import type {
  Asset,
  Client,
  CropType,
  Equipment,
  Farm,
  Field,
  GeoJsonPolygon,
  HarvestRecord,
  JDAsset,
  JDBoundary,
  JDClient,
  JDCropType,
  JDFarm,
  JDField,
  JDFieldOperation,
  JDMachine,
  JDMapLayer,
  JDOrganization,
  JDUser,
  MapLayer,
  Organization,
  PlantingRecord,
  User,
} from '@fieldmcp/types';

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

export function normalizeFarm(jd: JDFarm, organizationId: string): Farm {
  return {
    id: crypto.randomUUID(),
    externalId: jd.id,
    provider: 'john_deere',
    organizationId,
    name: jd.name,
  };
}

export function normalizeClient(jd: JDClient, organizationId: string): Client {
  return {
    id: crypto.randomUUID(),
    externalId: jd.id,
    provider: 'john_deere',
    organizationId,
    name: jd.name,
  };
}

export function normalizeMapLayer(jd: JDMapLayer, fieldId: string): MapLayer {
  const typeMap: Record<string, MapLayer['type']> = {
    yield: 'yield',
    elevation: 'elevation',
    soil: 'soil',
    prescription: 'prescription',
  };
  return {
    id: crypto.randomUUID(),
    fieldId,
    type: typeMap[jd.type] || 'other',
    name: jd.name,
    date: jd.dateCreated,
  };
}

export function normalizeCropType(jd: JDCropType): CropType {
  return {
    id: crypto.randomUUID(),
    externalId: jd.id,
    name: jd.name,
  };
}

export function normalizeUser(jd: JDUser, organizationId: string): User {
  return {
    id: crypto.randomUUID(),
    externalId: jd.id,
    provider: 'john_deere',
    organizationId,
    accountName: jd.accountName,
    givenName: jd.givenName,
    familyName: jd.familyName,
    userType: jd.userType,
  };
}

export function normalizeAsset(jd: JDAsset, organizationId: string): Asset {
  return {
    id: crypto.randomUUID(),
    externalId: jd.id,
    provider: 'john_deere',
    organizationId,
    title: jd.title,
    assetType: jd.assetType,
    assetCategory: jd.assetCategory,
    assetSubType: jd.assetSubType,
    serialNumber: jd.serialNumber,
  };
}
