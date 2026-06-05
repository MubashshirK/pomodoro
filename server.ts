import { createServer, IncomingMessage, ServerResponse } from "node:http";
import handler from "./api/[...path].js";

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

    const webRes = await handler(webReq);

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
