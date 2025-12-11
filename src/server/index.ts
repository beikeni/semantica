import { join } from "path";
import { config, validateConfig } from "./config";
import { logger, timestamp } from "./logger";
import { getCorsOrigins, formatCorsForDisplay } from "./cors";
import { handleOpen, handleClose, handleMessage } from "./websocket-handlers";
import { createSessionState } from "./speech/recognizer";
import type { SessionState } from "./speech/types";

// Validate Azure credentials before starting
validateConfig();

const ROOT_DIR = join(import.meta.dir, "..", "..");
const corsOrigins = getCorsOrigins();

function isOriginAllowed(origin: string | null): boolean {
  return corsOrigins.includes(origin);
}

const server = Bun.serve<{ state: SessionState }>({
  hostname: config.host,
  port: config.port,

  async fetch(req, server) {
    const url = new URL(req.url);
    const origin = req.headers.get("origin");

    // CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders(origin),
      });
    }

    // WebSocket upgrade
    if (req.headers.get("upgrade") === "websocket") {
      if (!isOriginAllowed(origin)) {
        return new Response("Forbidden", { status: 403 });
      }
      const success = server.upgrade(req, {
        data: { state: createSessionState() },
      });
      return success
        ? undefined
        : new Response("WebSocket upgrade failed", { status: 500 });
    }

    // Static file routes (development only)
    if (!config.isProduction) {
      if (url.pathname === "/" || url.pathname === "/index.html") {
        return serveFile(join(ROOT_DIR, "index.html"), "text/html");
      }
      if (url.pathname === "/recorder.worklet.js") {
        return serveFile(
          join(ROOT_DIR, "recorder.worklet.js"),
          "application/javascript"
        );
      }
      // Try to serve static files
      const staticResponse = await tryServeStatic(url.pathname);
      if (staticResponse) return staticResponse;
    }

    // Production: only serve recorder worklet
    if (url.pathname === "/recorder.worklet.js") {
      return serveFile(
        join(ROOT_DIR, "recorder.worklet.js"),
        "application/javascript"
      );
    }

    return new Response("Not Found", { status: 404 });
  },

  websocket: {
    open: handleOpen,
    close: handleClose,
    message: handleMessage,
    perMessageDeflate: true,
  },
});

function corsHeaders(origin: string | null): HeadersInit {
  const allowed = isOriginAllowed(origin) ? origin ?? "*" : "";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Credentials": "true",
  };
}

async function serveFile(path: string, contentType: string): Promise<Response> {
  const file = Bun.file(path);
  if (await file.exists()) {
    return new Response(file, {
      headers: { "Content-Type": contentType },
    });
  }
  return new Response("Not Found", { status: 404 });
}

async function tryServeStatic(pathname: string): Promise<Response | null> {
  const filePath = join(ROOT_DIR, pathname);
  const file = Bun.file(filePath);
  if (await file.exists()) {
    return new Response(file);
  }
  return null;
}

// Startup logging
const ts = timestamp();
const protocol = config.isProduction ? "https" : "http";
const displayHost =
  config.host === "127.0.0.1" ? "www.semantica-portuguese.com" : config.host;

console.log(
  `🚀 Server running in ${config.isProduction ? "PRODUCTION" : "LOCAL"} mode`
);
console.log(`📡 Listening at ${protocol}://${displayHost}:${config.port}`);

if (!config.isProduction) {
  console.log(
    `🌐 Test client available at: ${protocol}://${displayHost}:${config.port}`
  );
  console.log(
    `🎤 Open your browser and navigate to the URL above to test the speech recognizer`
  );
}

console.log(`🔗 CORS origins: ${formatCorsForDisplay(corsOrigins)}`);

logger.server(
  `${ts} - Server started in ${
    config.isProduction ? "production" : "local"
  } mode`
);
logger.server(`${ts} - Port: ${config.port}`);
logger.server(`${ts} - Host: ${config.host}`);

export { server };
