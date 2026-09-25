import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer as createViteServer } from "vite";
import mcpHandler from "./api/mcp.js";
import weatherHandler from "./api/weather.js";
import busStopsHandler from "./api/bus-stops.js";
import hotspotsHandler from "./api/hotspots.js";
import eventsHandler from "./api/events.js";
import onemapHandler from "./api/onemap.js";
import qaHandler from "./api/qa.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // CORS and parsing
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-requested-with");
    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }
    next();
  });

  app.use(express.json());

  // Register MCP server handler per requirement:
  // "In server.ts, after express.json(), register the same handler with app.post('/api/mcp', handler) and app.get('/api/mcp', handler)"
  app.post("/api/mcp", mcpHandler);
  app.get("/api/mcp", mcpHandler);

  // Register API data routes
  app.all("/api/weather", weatherHandler);
  app.all("/api/bus-stops", busStopsHandler);
  app.all("/api/hotspots", hotspotsHandler);
  app.all("/api/events", eventsHandler);
  app.all("/api/onemap", onemapHandler);
  app.all("/api/qa", qaHandler);

  const isProduction = process.env.NODE_ENV === "production";

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Singapore Taxi Navigator server running at http://0.0.0.0:${PORT}`);
    console.log(`MCP endpoint active at http://0.0.0.0:${PORT}/api/mcp`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
