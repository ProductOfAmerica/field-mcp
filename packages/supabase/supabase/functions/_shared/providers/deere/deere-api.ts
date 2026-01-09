interface DeereClientOptions {
  baseUrl: string;
  accessToken: string;
}

interface JDApiResponse<T> {
  values: T[];
  links?: Array<{ rel: string; uri: string }>;
}

interface JDOrganization {
  id: string;
  name: string;
  links?: Array<{ rel: string; uri: string }>;
}

interface JDField {
  id: string;
  name: string;
  activeCrop?: string;
  boundaries?: Array<{
    id: string;
    area?: { value: number; unit: string };
    multipolygons?: Array<{
      rings: Array<{
        points: Array<{ lat: number; lon: number }>;
      }>;
    }>;
  }>;
}

interface JDFieldOperation {
  id: string;
  operationType: string;
  startDate: string;
  endDate?: string;
  area?: { value: number; unit: string };
}

interface JDMachine {
  id: string;
  name: string;
  machineType: string;
  make?: string;
  model?: string;
  modelYear?: number;
}

interface JDFarm {
  id: string;
  name: string;
}

interface JDClient {
  id: string;
  name: string;
}

interface JDMapLayer {
  id: string;
  name: string;
  type: string;
  dateCreated: string;
}

interface JDCropType {
  id: string;
  name: string;
}

interface JDUser {
  id: string;
  accountName: string;
  givenName?: string;
  familyName?: string;
  userType?: string;
}

interface JDAsset {
  id: string;
  title: string;
  assetType?: string;
  assetCategory?: string;
  assetSubType?: string;
  serialNumber?: string;
}

export class DeereApiClient {
  private baseUrl: string;
  private accessToken: string;

  constructor(options: DeereClientOptions) {
    this.baseUrl = options.baseUrl;
    this.accessToken = options.accessToken;
  }

  private async request<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        Accept: 'application/vnd.deere.axiom.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error(`John Deere API error: ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  async getOrganizations(): Promise<JDApiResponse<JDOrganization>> {
    return this.request('/organizations');
  }

  async getFields(orgId: string): Promise<JDApiResponse<JDField>> {
    return this.request(`/organizations/${orgId}/fields`);
  }

  async getFieldBoundary(orgId: string, fieldId: string): Promise<JDField> {
    return this.request(
      `/organizations/${orgId}/fields/${fieldId}?embed=boundaries`,
    );
  }

  async getFieldOperations(
    orgId: string,
    params?: {
      fieldId?: string;
      operationType?: string;
      startDate?: string;
      endDate?: string;
    },
  ): Promise<JDApiResponse<JDFieldOperation>> {
    const searchParams = new URLSearchParams();
    if (params?.fieldId) searchParams.set('fieldId', params.fieldId);
    if (params?.operationType)
      searchParams.set('operationType', params.operationType);
    if (params?.startDate) searchParams.set('startDate', params.startDate);
    if (params?.endDate) searchParams.set('endDate', params.endDate);

    const query = searchParams.toString();
    return this.request(
      `/organizations/${orgId}/fieldOperations${query ? `?${query}` : ''}`,
    );
  }

  async getMachines(orgId: string): Promise<JDApiResponse<JDMachine>> {
    return this.request(`/organizations/${orgId}/machines`);
  }

  async getFarms(orgId: string): Promise<JDApiResponse<JDFarm>> {
    return this.request(`/organizations/${orgId}/farms`);
  }

  async getClients(orgId: string): Promise<JDApiResponse<JDClient>> {
    return this.request(`/organizations/${orgId}/clients`);
  }

  async getMapLayers(
    orgId: string,
    fieldId: string,
  ): Promise<JDApiResponse<JDMapLayer>> {
    return this.request(`/organizations/${orgId}/fields/${fieldId}/mapLayers`);
  }

  async getCropTypes(): Promise<JDApiResponse<JDCropType>> {
    return this.request('/cropTypes');
  }

  async getUsers(orgId: string): Promise<JDApiResponse<JDUser>> {
    return this.request(`/organizations/${orgId}/users`);
  }

  async getAssets(orgId: string): Promise<JDApiResponse<JDAsset>> {
    return this.request(`/organizations/${orgId}/assets`);
  }
}

export type {
  JDApiResponse,
  JDOrganization,
  JDField,
  JDFieldOperation,
  JDMachine,
  JDFarm,
  JDClient,
  JDMapLayer,
  JDCropType,
  JDUser,
  JDAsset,
};
