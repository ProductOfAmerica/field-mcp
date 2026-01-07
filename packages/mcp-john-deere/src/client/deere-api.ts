import type {
  JDApiResponse,
  JDField,
  JDFieldOperation,
  JDMachine,
  JDOrganization,
} from '@agrimcp/types';

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
}
