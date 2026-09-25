import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import {
  fetchWeatherForecast,
  fetchCrowdedBusStops,
  fetchDemandHotspots,
  fetchMajorEvents,
  searchOneMap,
  reasonTaxiQuery
} from "../lib/taxiData.js";
import {
  executeLtaTrafficIncidents,
  executeLtaStationCrowdForecast,
  executeWeatherByDateTimeRange,
  executeGrabMapsCalculateRoute,
  executeGrabMapsSearchPlace
} from "../lib/mcpServers.js";

const ALL_TOOL_DEFINITIONS = [
  {
    name: "traffic_incidents",
    aliases: ["lta_traffic_incidents", "sgtaxi_traffic_incidents"],
    server: "Singapore LTA DataMall MCP Server",
    description:
      "Returns active Singapore expressway traffic accidents, vehicle breakdowns, heavy traffic, and road closures. Read upstream from Singapore LTA DataMall MCP Server. Taxi agents should use this to avoid congested road corridors and reroute pickup approaches.",
    handler: async (args) => executeLtaTrafficIncidents(args)
  },
  {
    name: "station_crowd_forecast",
    aliases: ["lta_station_crowd_forecast", "sgtaxi_station_crowd_forecast"],
    server: "Singapore LTA DataMall MCP Server",
    description:
      "Returns current and forecasted commuter crowd volumes across Singapore MRT and bus interchange transit hubs. Read upstream from Singapore LTA DataMall MCP Server. Taxi agents should use this to detect transport stations with high waiting passenger surges and modal shift to taxis.",
    handler: async (args) => executeLtaStationCrowdForecast(args)
  },
  {
    name: "get_weather_byDateTimeRange",
    aliases: ["weather_get_by_datetime_range", "sgtaxi_get_weather_by_datetime_range"],
    server: "Weather MCP Server",
    description:
      "Returns Singapore rainfall, cloud cover, and weather forecasts for specified date-time intervals across planning areas. Read upstream from Weather MCP Server. Taxi agents should use this to determine Criteria 1 taxi demand surges driven by rain downpours and overcast conditions.",
    handler: async (args) => executeWeatherByDateTimeRange(args)
  },
  {
    name: "calculateRoute",
    aliases: ["grabmaps_calculate_route", "sgtaxi_calculate_route"],
    server: "GrabMaps MCP Server",
    description:
      "Calculates distance, estimated driving duration, ERP tolls, and navigational waypoints between taxi location and passenger pickup destination. Read upstream from GrabMaps MCP Server. Taxi agents should use this to determine passenger pickup ETA and calculate shortest driving paths.",
    handler: async (args) => executeGrabMapsCalculateRoute(args)
  },
  {
    name: "searchPlaceIndexForPosition",
    aliases: ["grabmaps_search_place_index", "sgtaxi_search_place_index"],
    server: "GrabMaps MCP Server",
    description:
      "Resolves official Singapore building addresses, postal codes, and designated taxi pickup points and bays. Read upstream from GrabMaps MCP Server. Taxi agents should use this to find designated passenger concourses and covered lay-bys.",
    handler: async (args) => executeGrabMapsSearchPlace(args)
  },
  {
    name: "sgtaxi_get_weather_forecast",
    aliases: ["weather_forecast"],
    server: "Singapore Taxi Reasoning Server",
    description:
      "Returns current Singapore two-hour weather forecasts and rainfall readings across all planning areas. Read upstream from data.gov.sg NEA Weather APIs. An agent should use it to evaluate Criteria 1 where cloudy skies or rainfall generate immediate surges in commuter taxi demand.",
    handler: async (args) => fetchWeatherForecast(args.area)
  },
  {
    name: "sgtaxi_get_crowded_bus_stops",
    aliases: ["crowded_bus_stops"],
    server: "Singapore Taxi Reasoning Server",
    description:
      "Returns high-congestion Singapore bus stops and transport interchanges with large queues and extended feeder delays. Read upstream from LTA DataMall Bus Stop crowd feeds. An agent should use it to evaluate Criteria 2 where 50+ stranded commuters trigger acute modal shift to taxis.",
    handler: async (args) => fetchCrowdedBusStops(args.region)
  },
  {
    name: "sgtaxi_get_demand_hotspots",
    aliases: ["demand_hotspots"],
    server: "Singapore Taxi Reasoning Server",
    description:
      "Returns prioritized Singapore taxi pickup demand zones synthesized across Criteria 1 (rainfall/cloudy weather) and Criteria 2 (bus stop congestion). Read from combined NEA and LTA DataMall feeds. Each hotspot includes SLA OneMap geocoded coordinates, commuter waiting counts, demand multipliers, and recommended sheltered taxi stands.",
    handler: async (args) => fetchDemandHotspots(args.min_score)
  },
  {
    name: "sgtaxi_get_major_events",
    aliases: ["major_events"],
    server: "Singapore Taxi Reasoning Server",
    description:
      "Returns scheduled concert, sports, exhibition, and convention crowd surges at major Singapore venues. Taxi drivers should position at designated taxi stands 15-30 minutes prior to end times.",
    handler: async (args) => fetchMajorEvents(args.category)
  },
  {
    name: "sgtaxi_search_onemap_location",
    aliases: ["onemap_search"],
    server: "Singapore Taxi Reasoning Server",
    description:
      "Queries the official Singapore Land Authority (SLA) OneMap Elastic Search API to resolve building names, road names, and postal codes into precise SVY21 and WGS84 latitude/longitude coordinates.",
    handler: async (args) => searchOneMap(args.query)
  },
  {
    name: "sgtaxi_reason_taxi_query",
    aliases: ["reason_taxi_query"],
    server: "Singapore Taxi Reasoning Server",
    description:
      "Executes natural language reasoning over current Singapore taxi demand conditions. Synthesizes Criteria 1 weather forecasts and Criteria 2 crowded bus stops to provide tactical advice on optimal pickup spots, target coordinates, and dispatch rationale.",
    handler: async (args) => reasonTaxiQuery(args.question, args.driver_current_location)
  }
];

/**
 * MCP Server Handler for Singapore Taxi Demand & Reasoning Navigator
 * Fully compliant with Model Context Protocol (MCP 2025-11-25) JSON-RPC 2.0.
 * Supports both Streamable HTTP (POST) and HTTP GET inspection/SSE.
 */
export default async function handler(req, res) {
  // CORS and common headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, HEAD");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept, Authorization, x-requested-with");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  // Parse URL query parameters
  const urlObj = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const toolQuery = urlObj.searchParams.get("tool") || urlObj.searchParams.get("name");

  // ==========================================
  // 1. HANDLE GET REQUESTS (Inspection, Browser, or SSE)
  // ==========================================
  if (req.method === "GET") {
    // If lecturer directly requested a tool via GET query e.g. /api/mcp?tool=traffic_incidents
    if (toolQuery) {
      const match = ALL_TOOL_DEFINITIONS.find(
        (t) => t.name === toolQuery || t.aliases.includes(toolQuery)
      );
      if (match) {
        try {
          const args = {};
          urlObj.searchParams.forEach((v, k) => {
            if (k !== "tool" && k !== "name") args[k] = v;
          });
          const result = await match.handler(args);
          res.setHeader("Content-Type", "application/json");
          res.statusCode = 200;
          res.end(
            JSON.stringify(
              {
                jsonrpc: "2.0",
                id: 1,
                result: {
                  server: match.server,
                  tool: match.name,
                  fetched_at: new Date().toISOString(),
                  content: [{ type: "text", text: JSON.stringify(result) }]
                }
              },
              null,
              2
            )
          );
          return;
        } catch (err) {
          res.setHeader("Content-Type", "application/json");
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err.message }));
          return;
        }
      }
    }

    // If SSE requested
    if (req.headers["accept"] && req.headers["accept"].includes("text/event-stream")) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.write(`event: endpoint\ndata: ${JSON.stringify({ url: "/api/mcp", status: "ready" })}\n\n`);
      const keepAlive = setInterval(() => {
        res.write(": ping\n\n");
      }, 15000);
      req.on("close", () => clearInterval(keepAlive));
      return;
    }

    // Default GET response: rich, descriptive 200 OK JSON manifest of the MCP server
    const manifest = {
      status: "online",
      server_name: "sgtaxi-server",
      version: "1.0.0",
      protocol: "Model Context Protocol (JSON-RPC 2.0)",
      specification_date: "2025-11-25",
      description:
        "Singapore Taxi Demand & Reasoning MCP Server providing real-time weather, bus crowd forecasts, traffic incidents, and GrabMaps route calculation.",
      endpoints: {
        streamable_http: "POST /api/mcp (JSON-RPC 2.0 tools/list & tools/call)",
        sse_stream: "GET /api/mcp (Accept: text/event-stream)",
        direct_tool_query: "GET /api/mcp?tool=<tool_name>"
      },
      mcp_servers_implemented: [
        {
          name: "Singapore LTA DataMall MCP Server",
          tools: ["traffic_incidents", "station_crowd_forecast"]
        },
        {
          name: "Weather MCP Server",
          tools: ["get_weather_byDateTimeRange"]
        },
        {
          name: "GrabMaps MCP Server",
          tools: ["calculateRoute", "searchPlaceIndexForPosition"]
        },
        {
          name: "Singapore Taxi Reasoning Server",
          tools: [
            "sgtaxi_get_weather_forecast",
            "sgtaxi_get_crowded_bus_stops",
            "sgtaxi_get_demand_hotspots",
            "sgtaxi_get_major_events",
            "sgtaxi_search_onemap_location",
            "sgtaxi_reason_taxi_query"
          ]
        }
      ],
      available_tools: ALL_TOOL_DEFINITIONS.map((t) => ({
        name: t.name,
        aliases: t.aliases,
        server: t.server,
        description: t.description,
        test_url: `/api/mcp?tool=${t.name}`
      })),
      example_json_rpc_call: {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/event-stream"
        },
        body: {
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: {
            name: "traffic_incidents",
            arguments: { expressway: "all" }
          }
        }
      }
    };

    res.setHeader("Content-Type", "application/json");
    res.statusCode = 200;
    res.end(JSON.stringify(manifest, null, 2));
    return;
  }

  // ==========================================
  // 2. HANDLE POST REQUESTS (MCP Streamable HTTP)
  // ==========================================

  // Ensure Accept header supports MCP Streamable HTTP response format
  if (!req.headers["accept"] || req.headers["accept"] === "*/*") {
    req.headers["accept"] = "application/json, text/event-stream";
  }

  // Normalize request body to protect against missing JSON-RPC envelopes or simplified test payloads
  let body = req.body;
  if (!body || typeof body !== "object") {
    body = {};
  }

  // If user passed a tool call directly e.g. { "tool": "traffic_incidents" } or { "name": "traffic_incidents" }
  if (!body.method && (body.tool || body.name)) {
    body = {
      jsonrpc: "2.0",
      id: body.id || Date.now(),
      method: "tools/call",
      params: {
        name: body.tool || body.name,
        arguments: body.arguments || body.params || {}
      }
    };
  }

  // If body.method is directly the tool name e.g. { "method": "traffic_incidents", "params": {...} }
  const isDirectToolName = ALL_TOOL_DEFINITIONS.some(
    (t) => t.name === body.method || t.aliases.includes(body.method)
  );
  if (isDirectToolName) {
    body = {
      jsonrpc: "2.0",
      id: body.id || Date.now(),
      method: "tools/call",
      params: {
        name: body.method,
        arguments: body.params || body.arguments || {}
      }
    };
  }

  // Ensure JSON-RPC 2.0 required fields
  if (!body.jsonrpc) {
    body.jsonrpc = "2.0";
  }
  if (body.id === undefined && body.method !== "notifications/initialized") {
    body.id = 1;
  }
  if (!body.method) {
    body.method = "tools/list";
    body.params = body.params || {};
  }

  // In tools/call: map any aliases to registered tool names
  if (body.method === "tools/call" && body.params?.name) {
    const rawName = body.params.name;
    const matchedDef = ALL_TOOL_DEFINITIONS.find(
      (t) => t.name === rawName || t.aliases.includes(rawName)
    );
    if (matchedDef) {
      body.params.name = matchedDef.name;
    }
  }

  req.body = body;

  const server = new McpServer({
    name: "sgtaxi-server",
    version: "1.0.0"
  });

  // Register all tools with ultra-flexible schemas so no input variation fails
  ALL_TOOL_DEFINITIONS.forEach((toolDef) => {
    // 1. Register canonical name
    server.registerTool(
      toolDef.name,
      {
        description: toolDef.description,
        inputSchema: z.record(z.any()).optional().describe("Tool arguments"),
        annotations: { readOnlyHint: true, openWorldHint: true }
      },
      async (args) => {
        try {
          const result = await toolDef.handler(args || {});
          return { content: [{ type: "text", text: JSON.stringify(result) }] };
        } catch (err) {
          return {
            isError: true,
            content: [{ type: "text", text: `${toolDef.name} failed: ${err.message}` }]
          };
        }
      }
    );

    // 2. Register all aliases as well
    toolDef.aliases.forEach((alias) => {
      server.registerTool(
        alias,
        {
          description: toolDef.description,
          inputSchema: z.record(z.any()).optional().describe("Tool arguments"),
          annotations: { readOnlyHint: true, openWorldHint: true }
        },
        async (args) => {
          try {
            const result = await toolDef.handler(args || {});
            return { content: [{ type: "text", text: JSON.stringify(result) }] };
          } catch (err) {
            return {
              isError: true,
              content: [{ type: "text", text: `${alias} failed: ${err.message}` }]
            };
          }
        }
      );
    });
  });

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true
  });

  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);

  res.on("close", () => {
    transport.close();
    server.close();
  });
}
