const GATEWAY_URL = process.env.MCP_GATEWAY_URL!;
const API_KEY = process.env.TEST_API_KEY!;
const FARMER_ID = process.env.TEST_FARMER_ID!;

interface McpResponse<T = unknown> {
  content?: Array<{ type: string; text: string }>;
  tools?: T[];
  error?: { message: string; code: string };
}

export async function mcpCall(
  toolName: string,
  args: Record<string, unknown>,
  options?: { farmerId?: string; apiKey?: string },
): Promise<McpResponse> {
  const response = await fetch(`${GATEWAY_URL}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${options?.apiKey ?? API_KEY}`,
      'X-Farmer-ID': options?.farmerId ?? FARMER_ID,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: { name: toolName, arguments: args },
    }),
  });

  return response.json() as Promise<McpResponse>;
}

export async function mcpListTools(options?: {
  farmerId?: string;
  apiKey?: string;
}): Promise<McpResponse> {
  const response = await fetch(`${GATEWAY_URL}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${options?.apiKey ?? API_KEY}`,
      'X-Farmer-ID': options?.farmerId ?? FARMER_ID,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
    }),
  });

  return response.json() as Promise<McpResponse>;
}

export async function rawRequest(
  path: string,
  options?: {
    method?: string;
    headers?: Record<string, string>;
    body?: unknown;
    rawBody?: boolean;
  },
): Promise<Response> {
  // GATEWAY_URL already includes /mcp-gateway, so just append the path suffix
  let url: string;
  if (path === '' || path === '/') {
    url = GATEWAY_URL;
  } else if (path.startsWith('/mcp-gateway')) {
    // For paths like '/mcp-gateway/health', strip the /mcp-gateway prefix
    // since GATEWAY_URL already ends with it
    const suffix = path.replace('/mcp-gateway', '');
    url = suffix ? `${GATEWAY_URL}${suffix}` : GATEWAY_URL;
  } else {
    // For paths like '/invalid', append directly
    url = `${GATEWAY_URL}${path}`;
  }
  return fetch(url, {
    method: options?.method ?? 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    body: options?.body
      ? options.rawBody
        ? (options.body as string)
        : JSON.stringify(options.body)
      : undefined,
  });
}

export function parseToolResponse<T>(response: McpResponse): T {
  if (response.error) {
    throw new Error(`MCP Error: ${response.error.message}`);
  }
  if (!response.content?.[0]?.text) {
    throw new Error('No content in response');
  }
  return JSON.parse(response.content[0].text) as T;
}

export const TEST_CONFIG = {
  GATEWAY_URL,
  API_KEY,
  FARMER_ID,
};
