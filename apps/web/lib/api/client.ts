export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export class ApiError extends Error {
  readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

interface ApiFetchOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  token?: string | null;
  revalidate?: number | false;
  signal?: AbortSignal;
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers: Record<string, string> = {};
  if (options.body !== undefined && !isFormData) headers["content-type"] = "application/json";
  if (options.token) headers.authorization = `Bearer ${options.token}`;

  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : isFormData ? (options.body as FormData) : JSON.stringify(options.body),
    signal: options.signal,
    next: options.revalidate === undefined ? { revalidate: 60 } : options.revalidate === false ? undefined : { revalidate: options.revalidate },
    cache: options.revalidate === false ? "no-store" : undefined
  });

  if (!response.ok) {
    let message = `Error ${response.status}`;
    try {
      const data = (await response.json()) as { message?: string | string[] };
      const raw = data.message;
      message = Array.isArray(raw) ? raw.join(", ") : (raw ?? message);
    } catch {
      void 0;
    }
    throw new ApiError(response.status, message);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return (await response.text()) as unknown as T;
  }
  return (await response.json()) as T;
}
