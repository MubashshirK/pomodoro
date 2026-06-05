type Handler = (req: Request, context?: { params: Record<string, string> }) => Promise<Response>;
type Loader = () => Promise<Handler>;

const handlers: Record<string, Loader> = {
  "/auth/register": () => import("./_handlers/auth/register.js").then((m) => m.default as Handler),
  "/auth/login": () => import("./_handlers/auth/login.js").then((m) => m.default as Handler),
  "/auth/logout": () => import("./_handlers/auth/logout.js").then((m) => m.default as Handler),
  "/auth/guest": () => import("./_handlers/auth/guest.js").then((m) => m.default as Handler),
  "/auth/me": () => import("./_handlers/auth/me.js").then((m) => m.default as Handler),
  "/auth/password": () => import("./_handlers/auth/password.js").then((m) => m.default as Handler),
  "/auth/profile": () => import("./_handlers/auth/profile.js").then((m) => m.default as Handler),
  "/tasks": () => import("./_handlers/tasks.js").then((m) => m.default as Handler),
  "/tasks/reorder": () => import("./_handlers/tasks/reorder.js").then((m) => m.default as Handler),
  "/sessions": () => import("./_handlers/sessions.js").then((m) => m.default as Handler),
  "/settings": () => import("./_handlers/settings.js").then((m) => m.default as Handler),
  "/stats": () => import("./_handlers/stats.js").then((m) => m.default as Handler),
  "/health": () => import("./_handlers/health.js").then((m) => m.default as Handler),
  "/_migrate": () => import("./_handlers/_migrate.js").then((m) => m.default as Handler),
};

const idHandlers: Record<string, Loader> = {
  "/tasks/:id": () => import("./_handlers/tasks/[id].js").then((m) => m.default as Handler),
  "/sessions/:id": () => import("./_handlers/sessions/[id].js").then((m) => m.default as Handler),
};

function jsonError(message: string, status: number, extra?: Record<string, unknown>): Response {
  return new Response(JSON.stringify({ error: message, ...(extra ?? {}) }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/api/, "").replace(/\/+$/, "") || "/";

  const loader = handlers[path];
  if (loader) {
    const h = await loader();
    return h(req);
  }

  for (const [pattern, idLoader] of Object.entries(idHandlers)) {
    const regex = new RegExp("^" + pattern.replace(/:(\w+)/g, "([^/]+)") + "$");
    const m = path.match(regex);
    if (m) {
      const h = await idLoader();
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
