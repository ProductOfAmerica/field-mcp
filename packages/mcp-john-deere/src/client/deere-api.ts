import type {
  JDApiResponse,
  JDAsset,
  JDClient,
  JDCropType,
  JDFarm,
  JDField,
  JDFieldOperation,
  JDMachine,
  JDMapLayer,
  JDOrganization,
  JDUser,
} from '@fieldmcp/types';

interface DeereClientOptions {
  baseUrl: string;
  accessToken: string;
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
