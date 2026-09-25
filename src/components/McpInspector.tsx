import React, { useState } from "react";
import {
  Radio,
  Terminal,
  Play,
  CheckCircle,
  AlertCircle,
  Copy,
  ExternalLink,
  Code,
  Layers,
  Sparkles
} from "lucide-react";

interface ToolInfo {
  name: string;
  description: string;
  defaultArgs: Record<string, any>;
  routeEquivalent: string;
}

const REGISTERED_TOOLS: ToolInfo[] = [
  {
    name: "sgtaxi_get_weather_forecast",
    description:
      "Returns current Singapore two-hour weather forecasts and rainfall readings across all planning areas. Read upstream from data.gov.sg NEA Weather APIs. An agent should use it to evaluate Criteria 1 where cloudy skies or rainfall generate immediate surges in commuter taxi demand. It does not cover extended multi-day forecasts or meteorological radar outside Singapore.",
    defaultArgs: { area: "all" },
    routeEquivalent: "GET /api/weather?area="
  },
  {
    name: "sgtaxi_get_crowded_bus_stops",
    description:
      "Returns heavily crowded Singapore bus stops with commuter congestion levels, queue estimates, and nearby MRT nodes. Read upstream from Singapore LTA DataMall and Transport Intelligence. An agent should use it to evaluate Criteria 2 where bus stop overcrowding prompts stranded commuters to switch to taxi rides. It does not cover train breakdown status or private shuttle schedules.",
    defaultArgs: { region: "all", min_crowd_level: "all" },
    routeEquivalent: "GET /api/bus-stops?region=&min_crowd="
  },
  {
    name: "sgtaxi_get_demand_hotspots",
    description:
      "Returns top-ranked Singapore taxi demand hotspot zones synthesized from live weather conditions, bus stop passenger overflow, and major venue events. Read upstream from combined Singapore LTA, NEA Weather, and SLA OneMap georeferencing services. An agent should use it to guide taxi drivers directly to locations with the highest passenger hail probability and quickest fare pickups. It does not cover private carpooling platforms or ride-hailing app surge pricing multipliers.",
    defaultArgs: { min_score: 50 },
    routeEquivalent: "GET /api/hotspots?min_score="
  },
  {
    name: "sgtaxi_get_major_events",
    description:
      "Returns high-density concerts, stadium sports, exhibitions, and entertainment gatherings currently driving taxi passenger demand in Singapore. Read upstream from Singapore Tourism and Venue Schedules. An agent should use it to anticipate massive pickup queues around venue dismissals and stadium exit gates. It does not provide ticket sales counts or private concert seating arrangements.",
    defaultArgs: { category: "all" },
    routeEquivalent: "GET /api/events?category="
  },
  {
    name: "sgtaxi_search_onemap_location",
    description:
      "Returns geocoded coordinates, postal codes, and official addresses for Singapore landmarks, buildings, and taxi pickup points. Read upstream from Singapore Land Authority (SLA) OneMap Elastic Search API. An agent should use it to resolve exact navigation coordinates and verified street addresses for taxi dispatch. It does not provide turn-by-turn road turn restrictions or real-time parking lot availability.",
    defaultArgs: { query: "Orchard" },
    routeEquivalent: "GET /api/onemap?query="
  },
  {
    name: "sgtaxi_reason_taxi_query",
    description:
      "Returns natural language tactical taxi dispatch recommendations analyzing live Singapore weather, bus stop crowding, SLA OneMap coordinates, and venue schedules. Read upstream from Singapore LTA, NEA Weather, SLA OneMap, and Taxi Reasoning AI. An agent should use it when answering driver questions about where to cruise, which pickup bay has shortest queue, and why specific areas are surging. It does not control vehicle navigation systems or accept automated trip bookings.",
    defaultArgs: {
      question: "Where should I head right now in Central given the cloudy weather?",
      driver_current_location: "Orchard"
    },
    routeEquivalent: "POST /api/qa"
  }
];

export const McpInspector: React.FC = () => {
  const [selectedTool, setSelectedTool] = useState<ToolInfo>(REGISTERED_TOOLS[0]);
  const [argsJson, setArgsJson] = useState<string>(
    JSON.stringify(REGISTERED_TOOLS[0].defaultArgs, null, 2)
  );
  const [isExecuting, setIsExecuting] = useState(false);
  const [rawResponse, setRawResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSelectTool = (tool: ToolInfo) => {
    setSelectedTool(tool);
    setArgsJson(JSON.stringify(tool.defaultArgs, null, 2));
    setRawResponse(null);
    setError(null);
  };

  const handleRunTool = async () => {
    setIsExecuting(true);
    setRawResponse(null);
    setError(null);

    let parsedArgs = {};
    try {
      parsedArgs = argsJson ? JSON.parse(argsJson) : {};
    } catch (e: any) {
      setError(`Invalid JSON arguments: ${e.message}`);
      setIsExecuting(false);
      return;
    }

    const payload = {
      jsonrpc: "2.0",
      id: Date.now(),
      method: "tools/call",
      params: {
        name: selectedTool.name,
        arguments: parsedArgs
      }
    };

    try {
      const res = await fetch("/api/mcp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/event-stream"
        },
        body: JSON.stringify(payload)
      });

      const text = await res.text();
      let parsed;
      try {
        parsed = JSON.parse(text);
        setRawResponse(JSON.stringify(parsed, null, 2));
      } catch {
        setRawResponse(text);
      }
    } catch (err: any) {
      setError(err.message || "Failed to execute tool on /api/mcp");
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCopyEndpoint = () => {
    const fullUrl = `${window.location.origin}/api/mcp`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      {/* MCP Header */}
      <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 p-6 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500 text-white font-bold">
                <Radio className="h-4 w-4" />
              </span>
              <span className="text-xs font-mono font-bold tracking-widest text-indigo-400 uppercase">
                MODEL CONTEXT PROTOCOL (MCP 2025-11-25)
              </span>
            </div>
            <h2 className="text-xl font-bold text-white sm:text-2xl">
              Published MCP Server at <code className="text-amber-400 font-mono">/api/mcp</code>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              Any external AI agent can discover and invoke Singapore Weather, LTA Bus Stop crowd intelligence, and SLA OneMap tools over Streamable HTTP.
            </p>
          </div>

          <div className="flex flex-col items-start sm:items-end gap-2">
            <div className="flex items-center gap-2">
              <div className="rounded-xl border border-indigo-500/40 bg-slate-950/80 px-3 py-1.5 font-mono text-xs text-indigo-300">
                POST /api/mcp
              </div>
              <button
                onClick={handleCopyEndpoint}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-500 transition-colors"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>{copied ? "Copied URL!" : "Copy Endpoint"}</span>
              </button>
            </div>
            <span className="text-[11px] text-slate-400">
              Compatible with Gemini SDK <code className="text-amber-300">mcpToTool</code>
            </span>
          </div>
        </div>
      </div>

      {/* Main Interactive Tool Tester */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Tool List Sidebar */}
        <div className="lg:col-span-5 space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1 flex items-center justify-between">
            <span>Registered MCP Tools</span>
            <span className="text-[10px] text-indigo-400 font-mono">prefix: sgtaxi_</span>
          </div>

          <div className="space-y-2">
            {REGISTERED_TOOLS.map((t) => {
              const isSelected = selectedTool.name === t.name;
              return (
                <div
                  key={t.name}
                  onClick={() => handleSelectTool(t)}
                  className={`cursor-pointer rounded-xl border p-3 transition-all ${
                    isSelected
                      ? "border-indigo-500 bg-indigo-950/40 shadow-lg shadow-indigo-950/40"
                      : "border-slate-800 bg-slate-900/80 hover:border-slate-700 hover:bg-slate-850"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-amber-400">
                      {t.name}
                    </span>
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[9px] text-slate-400">
                      {t.routeEquivalent}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                    {t.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Execution & Output Console */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-mono text-sm font-bold text-white flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-indigo-400" />
                  <span>{selectedTool.name}</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Wraps <code className="text-amber-300">{selectedTool.routeEquivalent}</code>
                </p>
              </div>

              <button
                onClick={handleRunTool}
                disabled={isExecuting}
                className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-md hover:bg-amber-400 disabled:opacity-50 transition-colors"
              >
                {isExecuting ? (
                  <>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                    <span>Executing...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 fill-current" />
                    <span>Test Tool Call</span>
                  </>
                )}
              </button>
            </div>

            {/* Description Card */}
            <div className="mt-3 rounded-xl bg-slate-950/60 border border-slate-800/80 p-3 text-xs text-slate-300 leading-relaxed">
              <span className="font-semibold text-slate-400 block mb-1">Tool Description:</span>
              {selectedTool.description}
            </div>

            {/* JSON Arguments Editor */}
            <div className="mt-3 space-y-1">
              <label className="text-[11px] font-mono font-semibold text-slate-400">
                Input Arguments (JSON):
              </label>
              <textarea
                rows={4}
                value={argsJson}
                onChange={(e) => setArgsJson(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 font-mono text-xs text-amber-300 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Error display */}
          {error && (
            <div className="rounded-xl border border-red-500/40 bg-red-950/30 p-3 text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Response Inspector */}
          {rawResponse && (
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 shadow-2xl space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>JSON-RPC Response Received</span>
                </span>
                <span className="text-slate-500 text-[10px]">Streamable HTTP 200 OK</span>
              </div>
              <pre className="max-h-80 overflow-auto rounded-xl bg-slate-900/90 p-3 font-mono text-[11px] text-cyan-300 leading-relaxed">
                {rawResponse}
              </pre>
            </div>
          )}

          {/* External Agent Integration Guide */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 text-xs text-slate-400 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-200">
              <Code className="h-4 w-4 text-amber-400" />
              <span>How External AI Agents Call This MCP Endpoint:</span>
            </div>
            <pre className="overflow-x-auto rounded-lg bg-slate-950 p-3 font-mono text-[11px] text-slate-300">
{`// Using Gemini SDK with mcpToTool:
import { GoogleGenAI } from "@google/genai";
import { mcpToTool } from "@google/genai/mcp";

const ai = new GoogleGenAI();
const tools = await mcpToTool("${window.location.origin}/api/mcp");
const response = await ai.models.generateContent({
  model: "gemini-2.5-flash",
  contents: "Find high taxi demand spots in Singapore with rain or crowded bus stops",
  tools: [tools]
});`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
