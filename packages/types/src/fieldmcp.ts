export interface Organization {
  id: string;
  externalId: string;
  provider: Provider;
  name: string;
  createdAt: string;
}

export interface Field {
  id: string;
  externalId: string;
  provider: Provider;
  organizationId: string;
  name: string;
  acres: number;
  boundaryGeoJson?: GeoJsonPolygon;
  activeCrop?: string;
}

export interface HarvestRecord {
  id: string;
  fieldId: string;
  date: string;
  crop: string;
  yieldPerAcre: number;
  yieldUnit: 'bu' | 'tons' | 'lbs';
  moisture?: number;
  totalArea: number;
  variety?: string;
}

export interface PlantingRecord {
  id: string;
  fieldId: string;
  date: string;
  crop: string;
  variety: string;
  populationPerAcre: number;
  totalArea: number;
}

export interface ApplicationRecord {
  id: string;
  fieldId: string;
  date: string;
  productName: string;
  productType:
    | 'fertilizer'
    | 'herbicide'
    | 'insecticide'
    | 'fungicide'
    | 'other';
  ratePerAcre: number;
  rateUnit: string;
  totalArea: number;
}

export interface Equipment {
  id: string;
  externalId: string;
  provider: Provider;
  organizationId: string;
  name: string;
  type: 'tractor' | 'combine' | 'sprayer' | 'planter' | 'implement' | 'other';
  make?: string;
  model?: string;
  year?: number;
}

export interface MapLayer {
  id: string;
  fieldId: string;
  type: 'yield' | 'elevation' | 'soil' | 'prescription' | 'other';
  name: string;
  date?: string;
  dataUrl?: string;
}

export interface GeoJsonPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}

export type Provider = 'john_deere' | 'climate_fieldview' | 'cnhi';

export interface Farm {
  id: string;
  externalId: string;
  provider: Provider;
  organizationId: string;
  name: string;
}

export interface Client {
  id: string;
  externalId: string;
  provider: Provider;
  organizationId: string;
  name: string;
}

export interface CropType {
  id: string;
  externalId: string;
  name: string;
}

export interface User {
  id: string;
  externalId: string;
  provider: Provider;
  organizationId: string;
  accountName: string;
  givenName?: string;
  familyName?: string;
  userType?: string;
}

export interface Asset {
  id: string;
  externalId: string;
  provider: Provider;
  organizationId: string;
  title: string;
  assetType: string;
  assetCategory?: string;
  assetSubType?: string;
  serialNumber?: string;
}
