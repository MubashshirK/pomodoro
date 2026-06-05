export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, message: string, body: unknown = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
};

// Local dev: Vite proxies /api/* -> http://127.0.0.1:5000 (see vite.config.ts)
// For Vercel deploys, change to "/server/api" (Vercel Services strips /server).
const BASE = "/api";

function buildUrl(path: string, params?: RequestOptions["params"]): string {
  let url = `${BASE}${path.startsWith("/") ? path : `/${path}`}`;
  if (params) {
    const usp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) usp.set(k, String(v));
    }
    const qs = usp.toString();
    if (qs) url += `?${qs}`;
  }
  return url;
}

export async function request<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, params, headers, ...rest } = options;
  const init: RequestInit = {
    credentials: "include",
    ...rest,
    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
  };
  if (body !== undefined) {
    init.body = typeof body === "string" ? body : JSON.stringify(body);
  }

  const res = await fetch(buildUrl(path, params), init);
  const text = await res.text();
  const data = text ? safeJsonParse(text) : null;

  if (!res.ok) {
    if (res.status === 401 && !isPublicAuthPath(path)) {
      redirectToLogin();
    }
    const message =
      (data && typeof data === "object" && "error" in data
        ? String((data as { error: unknown }).error)
        : null) || res.statusText || `Request failed (${res.status})`;
    throw new ApiError(res.status, message, data);
  }

  return data as T;
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

const PUBLIC_AUTH_PATHS = new Set(["/auth/login", "/auth/register"]);

function isPublicAuthPath(path: string): boolean {
  return PUBLIC_AUTH_PATHS.has(path.startsWith("/") ? path : `/${path}`);
}

let redirecting = false;
function redirectToLogin() {
  if (redirecting) return;
  if (
    typeof window !== "undefined" &&
    window.location.pathname !== "/login" &&
    window.location.pathname !== "/register"
  ) {
    redirecting = true;
    const next = encodeURIComponent(window.location.pathname);
    window.location.href = `/login?next=${next}`;
  }
}

export const api = {
  get: <T = unknown>(path: string, options: Omit<RequestOptions, "body" | "method"> = {}) =>
    request<T>(path, { ...options, method: "GET" }),
  post: <T = unknown>(path: string, body?: unknown, options: Omit<RequestOptions, "body" | "method"> = {}) =>
    request<T>(path, { ...options, method: "POST", body }),
  put: <T = unknown>(path: string, body?: unknown, options: Omit<RequestOptions, "body" | "method"> = {}) =>
    request<T>(path, { ...options, method: "PUT", body }),
  patch: <T = unknown>(path: string, body?: unknown, options: Omit<RequestOptions, "body" | "method"> = {}) =>
    request<T>(path, { ...options, method: "PATCH", body }),
  delete: <T = unknown>(path: string, options: Omit<RequestOptions, "method"> = {}) =>
    request<T>(path, { ...options, method: "DELETE" }),
};
