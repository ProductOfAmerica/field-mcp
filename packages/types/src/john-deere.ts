export interface JDOrganization {
  '@type': 'Organization';
  id: string;
  name: string;
  links: JDLink[];
}

export interface JDField {
  '@type': 'Field';
  id: string;
  name: string;
  boundaries?: JDBoundary[];
  activeCrop?: string;
  links: JDLink[];
}

export interface JDBoundary {
  '@type': 'Boundary';
  id: string;
  area: JDMeasurement;
  multipolygons: JDMultiPolygon[];
}

export interface JDMultiPolygon {
  '@type': 'MultiPolygon';
  rings: JDRing[];
}

export interface JDRing {
  '@type': 'Ring';
  points: JDPoint[];
  type: 'exterior' | 'interior';
}

export interface JDPoint {
  '@type': 'Point';
  lat: number;
  lon: number;
}

export interface JDMeasurement {
  '@type': 'Measurement';
  value: number;
  unit: string;
}

export interface JDLink {
  '@type': 'Link';
  rel: string;
  uri: string;
}

export interface JDFieldOperation {
  '@type': 'FieldOperation';
  id: string;
  operationType: 'seeded' | 'applied' | 'harvested' | 'tillage';
  startDate: string;
  endDate?: string;
  area: JDMeasurement;
  links: JDLink[];
}

export interface JDHarvestInfo {
  crop: string;
  variety?: string;
  wetMass?: JDMeasurement;
  dryMass?: JDMeasurement;
  moisture?: JDMeasurement;
  yield?: JDMeasurement;
}

export interface JDMachine {
  '@type': 'Machine';
  id: string;
  name: string;
  machineType: string;
  make?: string;
  model?: string;
  modelYear?: number;
  links: JDLink[];
}

export interface JDApiResponse<T> {
  values: T[];
  total: number;
  links: JDLink[];
}
