import { serve, file } from "bun";
import { join } from "path";

const isProd = process.env.NODE_ENV === "production";
const ROOT_DIR = join(import.meta.dir, "..");
const DIST_DIR = join(ROOT_DIR, "dist");

// In development, use Bun's HTML import for HMR
const devIndex = isProd ? null : await import("./index.html");

async function serveStatic(pathname: string): Promise<Response | null> {
  let filePath = join(DIST_DIR, pathname);
  let staticFile = file(filePath);

  if (await staticFile.exists()) {
    return new Response(staticFile);
  }

  // SPA fallback
  const indexFile = file(join(DIST_DIR, "index.html"));
  if (await indexFile.exists()) {
    return new Response(indexFile);
  }

  return null;
}

const server = serve({
  hostname: "0.0.0.0",
  port: 3000,
  routes: {
    "/api/hello": {
      async GET(req) {
        return Response.json({
          message: "Hello, world!",
          method: "GET",
        });
      },
      async PUT(req) {
        return Response.json({
          message: "Hello, world!",
          method: "PUT",
        });
      },
    },

    "/api/hello/:name": async (req) => {
      const name = req.params.name;
      return Response.json({
        message: `Hello, ${name}!`,
      });
    },

    // Serve AudioWorklet file (required for speech recognition)
    "/recorder.worklet.js": async () => {
      const workletFile = file(join(ROOT_DIR, "recorder.worklet.js"));
      if (await workletFile.exists()) {
        return new Response(workletFile, {
          headers: { "Content-Type": "application/javascript" },
        });
      }
      return new Response("Worklet not found", { status: 404 });
    },

    // Serve static files / SPA
    "/*": isProd
      ? async (req) => {
          const url = new URL(req.url);
          const response = await serveStatic(url.pathname);
          return response || new Response("Not Found", { status: 404 });
        }
      : devIndex!.default,
  },

  development: !isProd && {
    hmr: true,
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
