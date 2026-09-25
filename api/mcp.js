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

/**
 * MCP Server Handler for Singapore Taxi Demand & Reasoning Navigator
 * Exposes LTA bus stop crowd data, NEA weather forecasts, SLA OneMap, and taxi dispatch intelligence.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        jsonrpc: "2.0",
        error: { code: -32000, message: "Method not allowed" },
        id: null
      })
    );
    return;
  }

  // Ensure Accept header supports MCP Streamable HTTP response format
  if (!req.headers["accept"] || req.headers["accept"] === "*/*") {
    req.headers["accept"] = "application/json, text/event-stream";
  }

  const server = new McpServer({
    name: "sgtaxi-server",
    version: "1.0.0"
  });

  // 1. Tool: sgtaxi_get_weather_forecast (wraps GET /api/weather?area=)
  server.registerTool(
    "sgtaxi_get_weather_forecast",
    {
      description:
        "Returns current Singapore two-hour weather forecasts and rainfall readings across all planning areas. Read upstream from data.gov.sg NEA Weather APIs. An agent should use it to evaluate Criteria 1 where cloudy skies or rainfall generate immediate surges in commuter taxi demand. It does not cover extended multi-day forecasts or meteorological radar outside Singapore.",
      inputSchema: {
        area: z
          .string()
          .optional()
          .describe(
            "Singapore planning area name (e.g. 'Orchard', 'Jurong East', 'Bedok') or 'all' to filter forecast results"
          )
      },
      annotations: { readOnlyHint: true, openWorldHint: true }
    },
    async (args) => {
      try {
        const result = await fetchWeatherForecast(args.area);
        return {
          content: [{ type: "text", text: JSON.stringify(result) }]
        };
      } catch (err) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Singapore NEA Weather API failed with status error: ${err.message}`
            }
          ]
        };
      }
    }
  );

  // 2. Tool: sgtaxi_get_crowded_bus_stops (wraps GET /api/bus-stops?region=&min_crowd=)
  server.registerTool(
    "sgtaxi_get_crowded_bus_stops",
    {
      description:
        "Returns heavily crowded Singapore bus stops with commuter congestion levels, queue estimates, and nearby MRT nodes. Read upstream from Singapore LTA DataMall and Transport Intelligence. An agent should use it to evaluate Criteria 2 where bus stop overcrowding prompts stranded commuters to switch to taxi rides. It does not cover train breakdown status or private shuttle schedules.",
      inputSchema: {
        region: z
          .string()
          .optional()
          .describe(
            "Geographic region to filter bus stops: 'central', 'east', 'west', 'north', 'north-east', or 'all'"
          ),
        min_crowd_level: z
          .string()
          .optional()
          .describe(
            "Minimum passenger crowd level filter: 'moderate', 'high', 'severe', or 'all'"
          )
      },
      annotations: { readOnlyHint: true, openWorldHint: true }
    },
    async (args) => {
      try {
        const result = await fetchCrowdedBusStops(
          args.region,
          args.min_crowd_level
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result) }]
        };
      } catch (err) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Singapore LTA DataMall bus stops upstream failed with status error: ${err.message}`
            }
          ]
        };
      }
    }
  );

  // 3. Tool: sgtaxi_get_demand_hotspots (wraps GET /api/hotspots?min_score=)
  server.registerTool(
    "sgtaxi_get_demand_hotspots",
    {
      description:
        "Returns top-ranked Singapore taxi demand hotspot zones synthesized from live weather conditions, bus stop passenger overflow, and major venue events. Read upstream from combined Singapore LTA, NEA Weather, and SLA OneMap georeferencing services. An agent should use it to guide taxi drivers directly to locations with the highest passenger hail probability and quickest fare pickups. It does not cover private carpooling platforms or ride-hailing app surge pricing multipliers.",
      inputSchema: {
        min_score: z
          .number()
          .optional()
          .describe(
            "Minimum taxi demand score threshold between 0 and 100 to filter top hotspot zones"
          )
      },
      annotations: { readOnlyHint: true, openWorldHint: true }
    },
    async (args) => {
      try {
        const result = await fetchDemandHotspots(args.min_score);
        return {
          content: [{ type: "text", text: JSON.stringify(result) }]
        };
      } catch (err) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Singapore Taxi Demand Hotspots upstream failed with status error: ${err.message}`
            }
          ]
        };
      }
    }
  );

  // 4. Tool: sgtaxi_get_major_events (wraps GET /api/events?category=)
  server.registerTool(
    "sgtaxi_get_major_events",
    {
      description:
        "Returns high-density concerts, stadium sports, exhibitions, and entertainment gatherings currently driving taxi passenger demand in Singapore. Read upstream from Singapore Tourism and Venue Schedules. An agent should use it to anticipate massive pickup queues around venue dismissals and stadium exit gates. It does not provide ticket sales counts or private concert seating arrangements.",
      inputSchema: {
        category: z
          .string()
          .optional()
          .describe(
            "Event category filter: 'concert', 'exhibition', 'sports', 'nightlife', or 'all'"
          )
      },
      annotations: { readOnlyHint: true, openWorldHint: true }
    },
    async (args) => {
      try {
        const result = await fetchMajorEvents(args.category);
        return {
          content: [{ type: "text", text: JSON.stringify(result) }]
        };
      } catch (err) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Singapore Major Events upstream failed with status error: ${err.message}`
            }
          ]
        };
      }
    }
  );

  // 5. Tool: sgtaxi_search_onemap_location (wraps GET /api/onemap?query=)
  server.registerTool(
    "sgtaxi_search_onemap_location",
    {
      description:
        "Returns geocoded coordinates, postal codes, and official addresses for Singapore landmarks, buildings, and taxi pickup points. Read upstream from Singapore Land Authority (SLA) OneMap Elastic Search API. An agent should use it to resolve exact navigation coordinates and verified street addresses for taxi dispatch. It does not provide turn-by-turn road turn restrictions or real-time parking lot availability.",
      inputSchema: {
        query: z
          .string()
          .describe(
            "Search query such as building name, street name, landmark, MRT station, or 6-digit postal code"
          )
      },
      annotations: { readOnlyHint: true, openWorldHint: true }
    },
    async (args) => {
      try {
        const result = await searchOneMap(args.query);
        return {
          content: [{ type: "text", text: JSON.stringify(result) }]
        };
      } catch (err) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `SLA OneMap API failed with upstream error: ${err.message}`
            }
          ]
        };
      }
    }
  );

  // 6. Tool: sgtaxi_reason_taxi_query (wraps POST /api/qa)
  server.registerTool(
    "sgtaxi_reason_taxi_query",
    {
      description:
        "Returns natural language tactical taxi dispatch recommendations analyzing live Singapore weather, bus stop crowding, SLA OneMap coordinates, and venue schedules. Read upstream from Singapore LTA, NEA Weather, SLA OneMap, and Taxi Reasoning AI. An agent should use it when answering driver questions about where to cruise, which pickup bay has shortest queue, and why specific areas are surging. It does not control vehicle navigation systems or accept automated trip bookings.",
      inputSchema: {
        question: z
          .string()
          .describe(
            "Natural language question from taxi driver seeking dispatch advice, weather impact, or crowded bus stop locations"
          ),
        driver_current_location: z
          .string()
          .optional()
          .describe(
            "Driver's current location or sector in Singapore (e.g. 'Orchard', 'Jurong East', 'Changi Airport')"
          )
      },
      annotations: { readOnlyHint: true, openWorldHint: true }
    },
    async (args) => {
      try {
        const result = await reasonTaxiQuery(
          args.question,
          args.driver_current_location
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result) }]
        };
      } catch (err) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Singapore Taxi Reasoning Engine failed with upstream error: ${err.message}`
            }
          ]
        };
      }
    }
  );

  // 7. Tool: lta_traffic_incidents (Singapore LTA DataMall MCP Server)
  server.registerTool(
    "lta_traffic_incidents",
    {
      description:
        "Returns active Singapore expressway traffic accidents, vehicle breakdowns, heavy traffic, and road closures. Read upstream from Singapore LTA DataMall MCP Server. Taxi agents should use this to avoid congested road corridors and reroute pickup approaches. It does not provide private car park congestion feeds.",
      inputSchema: {
        expressway: z
          .string()
          .optional()
          .describe("Expressway acronym to filter (e.g. 'CTE', 'PIE', 'AYE', 'ECP') or 'all'")
      },
      annotations: { readOnlyHint: true, openWorldHint: true }
    },
    async (args) => {
      try {
        const result = await executeLtaTrafficIncidents(args);
        return { content: [{ type: "text", text: JSON.stringify(result) }] };
      } catch (err) {
        return { isError: true, content: [{ type: "text", text: `LTA DataMall incidents failed: ${err.message}` }] };
      }
    }
  );

  // 8. Tool: lta_station_crowd_forecast (Singapore LTA DataMall MCP Server)
  server.registerTool(
    "lta_station_crowd_forecast",
    {
      description:
        "Returns current and forecasted commuter crowd volumes across Singapore MRT and bus interchange transit hubs. Read upstream from Singapore LTA DataMall MCP Server. Taxi agents should use this to detect transport stations with high waiting passenger surges and modal shift to taxis. It does not cover private charter bus operations.",
      inputSchema: {
        region: z.string().optional().describe("Region filter: 'Central', 'East', 'West', 'North', or 'all'"),
        min_crowd_level: z.string().optional().describe("Minimum crowd level: 'high', 'very_high', or 'all'")
      },
      annotations: { readOnlyHint: true, openWorldHint: true }
    },
    async (args) => {
      try {
        const result = await executeLtaStationCrowdForecast(args);
        return { content: [{ type: "text", text: JSON.stringify(result) }] };
      } catch (err) {
        return { isError: true, content: [{ type: "text", text: `LTA DataMall crowd forecast failed: ${err.message}` }] };
      }
    }
  );

  // 9. Tool: weather_get_by_datetime_range (Weather MCP Server)
  server.registerTool(
    "weather_get_by_datetime_range",
    {
      description:
        "Returns Singapore rainfall, cloud cover, and weather forecasts for specified date-time intervals across planning areas. Read upstream from Weather MCP Server. Taxi agents should use this to determine Criteria 1 taxi demand surges driven by rain downpours and overcast conditions. It does not predict marine offshore tidal conditions.",
      inputSchema: {
        start_time: z.string().optional().describe("Start time in ISO format or HH:mm"),
        end_time: z.string().optional().describe("End time in ISO format or HH:mm"),
        location: z.string().optional().describe("Planning area name or 'all'")
      },
      annotations: { readOnlyHint: true, openWorldHint: true }
    },
    async (args) => {
      try {
        const result = await executeWeatherByDateTimeRange(args);
        return { content: [{ type: "text", text: JSON.stringify(result) }] };
      } catch (err) {
        return { isError: true, content: [{ type: "text", text: `Weather MCP Server failed: ${err.message}` }] };
      }
    }
  );

  // 10. Tool: grabmaps_calculate_route (GrabMaps MCP Server)
  server.registerTool(
    "grabmaps_calculate_route",
    {
      description:
        "Calculates distance, estimated driving duration, ERP tolls, and navigational waypoints between taxi location and passenger pickup destination. Read upstream from GrabMaps MCP Server. Taxi agents should use this to determine passenger pickup ETA and calculate shortest driving paths. It does not calculate walking or cycling routes.",
      inputSchema: {
        origin: z.object({
          latitude: z.number(),
          longitude: z.number(),
          name: z.string().optional()
        }).describe("Driver starting coordinates and location name"),
        destination: z.object({
          latitude: z.number(),
          longitude: z.number(),
          name: z.string().optional()
        }).describe("Target pickup coordinates and location name")
      },
      annotations: { readOnlyHint: true, openWorldHint: true }
    },
    async (args) => {
      try {
        const result = await executeGrabMapsCalculateRoute(args);
        return { content: [{ type: "text", text: JSON.stringify(result) }] };
      } catch (err) {
        return { isError: true, content: [{ type: "text", text: `GrabMaps calculateRoute failed: ${err.message}` }] };
      }
    }
  );

  // 11. Tool: grabmaps_search_place_index (GrabMaps MCP Server)
  server.registerTool(
    "grabmaps_search_place_index",
    {
      description:
        "Resolves official Singapore building addresses, postal codes, and designated taxi pickup points and bays. Read upstream from GrabMaps MCP Server. Taxi agents should use this to find designated passenger concourses and covered lay-bys. It does not check underground car park parking space availability.",
      inputSchema: {
        query: z.string().describe("Search term such as mall name, building, street, or 6-digit postal code")
      },
      annotations: { readOnlyHint: true, openWorldHint: true }
    },
    async (args) => {
      try {
        const result = await executeGrabMapsSearchPlace(args);
        return { content: [{ type: "text", text: JSON.stringify(result) }] };
      } catch (err) {
        return { isError: true, content: [{ type: "text", text: `GrabMaps searchPlaceIndex failed: ${err.message}` }] };
      }
    }
  );

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
