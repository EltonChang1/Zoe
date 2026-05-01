import { API_BASE_URL } from "./config";
import type { ApiError } from "./types";

/**
 * Typed HTTP error. Carries the server's structured error envelope so callers
 * can branch on `code` rather than string-matching messages.
 */
export class ApiHttpError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiHttpError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
  token?: string | null;
  /** optional query object that will be serialised and appended to the URL */
  query?: Record<string, string | number | boolean | null | undefined>;
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const base = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  if (!query) return base;
  const params = Object.entries(query)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return params.length ? `${base}?${params.join("&")}` : base;
}

/**
 * Low-level request helper. Throws `ApiHttpError` on non-2xx responses;
 * returns the parsed JSON body otherwise.
 */
export async function request<TResponse>(
  path: string,
  opts: RequestOptions = {},
): Promise<TResponse> {
  const { method = "GET", body, signal, token, query } = opts;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (err) {
    // Network error — surface as a structured error so UIs can show a
    // consistent empty state.
    throw new ApiHttpError(
      0,
      "network_error",
      err instanceof Error ? err.message : "Network request failed",
    );
  }

  // 204 No Content
  if (res.status === 204) return undefined as TResponse;

  const text = await res.text();
  const payload = text ? safeParseJson(text) : undefined;

  if (!res.ok) {
    const envelope = payload as ApiError | undefined;
    throw new ApiHttpError(
      res.status,
      envelope?.error?.code ?? "http_error",
      envelope?.error?.message ?? res.statusText ?? `HTTP ${res.status}`,
      envelope?.error?.details,
    );
  }

  return payload as TResponse;
}

function safeParseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}
