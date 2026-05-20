// Helper para llamar a la API con o sin token
const BASE_URL = process.env.TEST_BASE_URL!;

export type ApiResponse<T = any> = {
  status: number;
  ok: boolean;
  body: T;
  headers: Headers;
};

export async function apiCall<T = any>(
  path: string,
  options: {
    method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
    token?: string;
    body?: any;
    headers?: Record<string, string>;
  } = {},
): Promise<ApiResponse<T>> {
  const { method = "GET", token, body, headers = {} } = options;

  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...headers,
  };

  if (token) {
    requestHeaders["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  let parsedBody: any;
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    parsedBody = await res.json().catch(() => null);
  } else {
    parsedBody = await res.text().catch(() => null);
  }

  return {
    status: res.status,
    ok: res.ok,
    body: parsedBody,
    headers: res.headers,
  };
}
