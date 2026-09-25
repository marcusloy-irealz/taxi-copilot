import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, Plugin } from "vite";
import mcpHandler from "./api/mcp.js";
import weatherHandler from "./api/weather.js";
import busStopsHandler from "./api/bus-stops.js";
import hotspotsHandler from "./api/hotspots.js";
import eventsHandler from "./api/events.js";
import onemapHandler from "./api/onemap.js";
import qaHandler from "./api/qa.js";

function apiRoutesPlugin(): Plugin {
  return {
    name: "api-routes-plugin",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url) {
          // Normalize Windows backslashes (e.g. api\mcp -> /api/mcp)
          req.url = req.url.replace(/\\+/g, "/");
          if (!req.url.startsWith("/")) {
            req.url = "/" + req.url;
          }
        }

        if (!req.url?.startsWith("/api/")) {
          return next();
        }

        const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
        const pathname = url.pathname.replace(/\/+$/, "");
        const query: Record<string, string> = {};
        url.searchParams.forEach((val, key) => {
          query[key] = val;
        });

        // Add Express-like helpers if missing
        const reqAny = req as any;
        const resAny = res as any;
        reqAny.query = query;

        if (!resAny.status) {
          resAny.status = function (code: number) {
            this.statusCode = code;
            return this;
          };
        }
        if (!resAny.json) {
          resAny.json = function (data: any) {
            this.setHeader("Content-Type", "application/json");
            this.end(JSON.stringify(data));
            return this;
          };
        }

        // Parse JSON body for POST/PUT if not already parsed
        if (["POST", "PUT", "PATCH"].includes(req.method || "")) {
          const chunks: any[] = [];
          for await (const chunk of req) {
            chunks.push(chunk);
          }
          const raw = Buffer.concat(chunks).toString();
          try {
            reqAny.body = raw ? JSON.parse(raw) : {};
          } catch {
            reqAny.body = {};
          }
        }

        try {
          if (pathname === "/api/mcp") {
            await mcpHandler(reqAny, resAny);
          } else if (pathname === "/api/weather") {
            await weatherHandler(reqAny, resAny);
          } else if (pathname === "/api/bus-stops") {
            await busStopsHandler(reqAny, resAny);
          } else if (pathname === "/api/hotspots") {
            await hotspotsHandler(reqAny, resAny);
          } else if (pathname === "/api/events") {
            await eventsHandler(reqAny, resAny);
          } else if (pathname === "/api/onemap") {
            await onemapHandler(reqAny, resAny);
          } else if (pathname === "/api/qa") {
            await qaHandler(reqAny, resAny);
          } else {
            next();
          }
        } catch (err: any) {
          console.error("API Error:", err);
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: err.message || "Internal server error" }));
        }
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiRoutesPlugin()],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname || ".")
      }
    },
    server: {
      port: 3000,
      host: "0.0.0.0",
      hmr: process.env.DISABLE_HMR !== "true",
      watch: process.env.DISABLE_HMR === "true" ? null : {}
    }
  };
});
