import type { Config } from "@vercel/functions";

export const config: Config = {
  runtime: "nodejs20.x",
};

type Handler = (req: Request, context?: { params: Record<string, string> }) => Promise<Response>;

const handlers: Record<string, Handler> = {
  "/auth/register": () => import("./_handlers/auth/register.js").then((m) => m.default),
  "/auth/login": () => import("./_handlers/auth/login.js").then((m) => m.default),
  "/auth/logout": () => import("./_handlers/auth/logout.js").then((m) => m.default),
  "/auth/guest": () => import("./_handlers/auth/guest.js").then((m) => m.default),
  "/auth/me": () => import("./_handlers/auth/me.js").then((m) => m.default),
  "/auth/password": () => import("./_handlers/auth/password.js").then((m) => m.default),
  "/auth/profile": () => import("./_handlers/auth/profile.js").then((m) => m.default),
  "/tasks": () => import("./_handlers/tasks.js").then((m) => m.default),
  "/tasks/reorder": () => import("./_handlers/tasks/reorder.js").then((m) => m.default),
  "/sessions": () => import("./_handlers/sessions.js").then((m) => m.default),
  "/settings": () => import("./_handlers/settings.js").then((m) => m.default),
  "/stats": () => import("./_handlers/stats.js").then((m) => m.default),
  "/health": () => import("./_handlers/health.js").then((m) => m.default),
  "/_migrate": () => import("./_handlers/_migrate.js").then((m) => m.default),
};

const idHandlers: Record<string, Handler> = {
  "/tasks/:id": () => import("./_handlers/tasks/[id].js").then((m) => m.default),
  "/sessions/:id": () => import("./_handlers/sessions/[id].js").then((m) => m.default),
};

function jsonError(message: string, status: number, extra?: Record<string, unknown>): Response {
  return new Response(JSON.stringify({ error: message, ...(extra ?? {}) }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function json(data: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  return new Response(JSON.stringify(data), { ...init, headers });
}

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/api/, "").replace(/\/+$/, "") || "/";

  if (handlers[path]) {
    const h = await handlers[path]();
    return h(req);
  }

  for (const [pattern, loader] of Object.entries(idHandlers)) {
    const regex = new RegExp("^" + pattern.replace(/:(\w+)/g, "([^/]+)") + "$");
    const m = path.match(regex);
    if (m) {
      const h = await loader();
      const paramNames = [...pattern.matchAll(/:(\w+)/g)].map((x) => x[1]);
      const params: Record<string, string> = {};
      paramNames.forEach((name, i) => { params[name] = m[i + 1]; });
      return h(req, { params });
    }
  }

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
  }

  return jsonError("Not found", 404, { path });
}
