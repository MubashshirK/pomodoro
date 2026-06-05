import { createServer, IncomingMessage, ServerResponse } from "node:http";

import register from "./api/auth/register.js";
import login from "./api/auth/login.js";
import logout from "./api/auth/logout.js";
import guest from "./api/auth/guest.js";
import me from "./api/auth/me.js";
import password from "./api/auth/password.js";
import profile from "./api/auth/profile.js";

import tasksIndex from "./api/tasks.js";
import taskReorder from "./api/tasks/reorder.js";
import taskItem from "./api/tasks/[id].js";

import sessionsIndex from "./api/sessions.js";
import sessionItem from "./api/sessions/[id].js";

import settings from "./api/settings.js";
import stats from "./api/stats.js";
import health from "./api/health.js";
import migrate from "./api/_migrate.js";

type Handler = (req: Request, context?: { params: Record<string, string> }) => Promise<Response>;
type Route = { method: string; pattern: RegExp; paramNames: string[]; handler: Handler };

const routes: Route[] = [
  { method: "POST", pattern: /^\/api\/auth\/register$/, paramNames: [], handler: (req) => register(req) },
  { method: "POST", pattern: /^\/api\/auth\/login$/, paramNames: [], handler: (req) => login(req) },
  { method: "POST", pattern: /^\/api\/auth\/logout$/, paramNames: [], handler: (req) => logout(req) },
  { method: "POST", pattern: /^\/api\/auth\/guest$/, paramNames: [], handler: (req) => guest(req) },
  { method: "ANY", pattern: /^\/api\/auth\/me$/, paramNames: [], handler: (req) => me(req) },
  { method: "PUT", pattern: /^\/api\/auth\/password$/, paramNames: [], handler: (req) => password(req) },
  { method: "PUT", pattern: /^\/api\/auth\/profile$/, paramNames: [], handler: (req) => profile(req) },

  { method: "ANY", pattern: /^\/api\/tasks$/, paramNames: [], handler: (req) => tasksIndex(req) },
  { method: "POST", pattern: /^\/api\/tasks\/reorder$/, paramNames: [], handler: (req) => taskReorder(req) },
  { method: "ANY", pattern: /^\/api\/tasks\/([^/]+)$/, paramNames: ["id"], handler: (req, ctx) => taskItem(req, ctx) },

  { method: "ANY", pattern: /^\/api\/sessions$/, paramNames: [], handler: (req) => sessionsIndex(req) },
  { method: "ANY", pattern: /^\/api\/sessions\/([^/]+)$/, paramNames: ["id"], handler: (req, ctx) => sessionItem(req, ctx) },

  { method: "ANY", pattern: /^\/api\/settings$/, paramNames: [], handler: (req) => settings(req) },
  { method: "GET", pattern: /^\/api\/stats$/, paramNames: [], handler: (req) => stats(req) },
  { method: "GET", pattern: /^\/api\/health$/, paramNames: [], handler: (req) => health(req) },
  { method: "POST", pattern: /^\/api\/_migrate$/, paramNames: [], handler: (req) => migrate(req) },
];

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

async function handleRequest(nodeReq: IncomingMessage, nodeRes: ServerResponse) {
  try {
    const url = new URL(nodeReq.url ?? "/", `http://${nodeReq.headers.host ?? "localhost"}`);

    let matched: Route | null = null;
    let params: Record<string, string> = {};
    for (const route of routes) {
      if (route.method !== "ANY" && route.method !== nodeReq.method) continue;
      const m = url.pathname.match(route.pattern);
      if (m) {
        matched = route;
        for (let i = 0; i < route.paramNames.length; i++) {
          params[route.paramNames[i]] = decodeURIComponent(m[i + 1]);
        }
        break;
      }
    }

    if (!matched) {
      nodeRes.statusCode = 404;
      nodeRes.setHeader("Content-Type", "application/json");
      nodeRes.end(JSON.stringify({ error: "Not found" }));
      return;
    }

    const headers = new Headers();
    for (const [k, v] of Object.entries(nodeReq.headers)) {
      if (v === undefined) continue;
      if (Array.isArray(v)) for (const x of v) headers.append(k, x);
      else headers.set(k, String(v));
    }

    let body: string | undefined;
    if (nodeReq.method !== "GET" && nodeReq.method !== "HEAD") {
      body = await readBody(nodeReq);
    }

    const webReq = new Request(url.toString(), {
      method: nodeReq.method,
      headers,
      body,
    });

    const webRes = await matched.handler(webReq, { params });

    nodeRes.statusCode = webRes.status;
    webRes.headers.forEach((v, k) => nodeRes.setHeader(k, v));
    const responseBody = await webRes.text();
    nodeRes.end(responseBody);
  } catch (err) {
    console.error("server error:", err);
    nodeRes.statusCode = 500;
    nodeRes.setHeader("Content-Type", "application/json");
    nodeRes.end(JSON.stringify({ error: "Internal server error" }));
  }
}

const PORT = Number(process.env.PORT) || 3000;
createServer(handleRequest).listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});
