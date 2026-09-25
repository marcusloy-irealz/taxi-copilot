import React, { useState } from "react";
import {
  Sparkles,
  Send,
  CloudRain,
  Users,
  Compass,
  MapPin,
  Calendar,
  AlertCircle,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  Navigation,
  Radio,
  Clock,
  Car,
  ChevronDown,
  ChevronUp,
  Code,
  Terminal,
  Play,
  Route,
  ShieldAlert,
  ArrowRight
} from "lucide-react";
import { McpQuestionAnswerResponse, McpServerExecutionLog, Coordinates } from "../types";

interface QAPageProps {
  onPlotRouteOnOneMap?: (target: {
    name: string;
    coordinates: Coordinates;
    route_summary: any;
    waypoints: number[][];
    incidents: any[];
  }) => void;
  initialQuestion?: string;
}

const SAMPLE_QUESTIONS = [
  "Where should I head right now in Central given the rainy weather and traffic?",
  "Any traffic accidents on CTE or PIE? Check crowded MRT stations.",
  "Calculate route to Jurong East Bus Interchange and verify passenger queues.",
  "What is the weather forecast for Orchard and are bus stops overcrowded?",
  "Check station crowd forecast at Woodlands & Tampines for evening pickup.",
  "Is Marina Bay Sands surging with rain? Plan route and check ERP gantries."
];

export const QAPage: React.FC<QAPageProps> = ({
  onPlotRouteOnOneMap,
  initialQuestion = ""
}) => {
  const [question, setQuestion] = useState(initialQuestion || SAMPLE_QUESTIONS[0]);
  const [driverLocation, setDriverLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [qaResponse, setQaResponse] = useState<McpQuestionAnswerResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Inspector toggles
  const [expandedLogIdx, setExpandedLogIdx] = useState<number | null>(null);
  const [showMcpSandbox, setShowMcpSandbox] = useState(false);

  // Sandbox testing
  const [sandboxServer, setSandboxServer] = useState<"lta" | "weather" | "grabmaps">("lta");
  const [sandboxTool, setSandboxTool] = useState("traffic_incidents");
  const [sandboxArgs, setSandboxArgs] = useState("{}");
  const [sandboxResult, setSandboxResult] = useState<any>(null);
  const [sandboxLoading, setSandboxLoading] = useState(false);

  const handleSubmit = async (qText?: string) => {
    const query = qText || question;
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: query,
          driver_current_location: driverLocation
        })
      });

      if (!res.ok) {
        throw new Error(`MCP reasoning service responded with status ${res.status}`);
      }

      const data: McpQuestionAnswerResponse = await res.json();
      setQaResponse(data);
    } catch (err: any) {
      console.error("MCP QA Error:", err);
      setError(err.message || "Failed to execute MCP query pipeline.");
    } finally {
      setLoading(false);
    }
  };

  const handleRunSandbox = async () => {
    setSandboxLoading(true);
    setSandboxResult(null);

    let parsed = {};
    try {
      parsed = sandboxArgs ? JSON.parse(sandboxArgs) : {};
    } catch (e: any) {
      alert("Invalid JSON arguments");
      setSandboxLoading(false);
      return;
    }

    try {
      // Map to registered MCP tool name in /api/mcp
      let mcpToolName = sandboxTool;
      if (sandboxTool === "traffic_incidents") mcpToolName = "lta_traffic_incidents";
      else if (sandboxTool === "station_crowd_forecast") mcpToolName = "lta_station_crowd_forecast";
      else if (sandboxTool === "get_weather_byDateTimeRange") mcpToolName = "weather_get_by_datetime_range";
      else if (sandboxTool === "calculateRoute") mcpToolName = "grabmaps_calculate_route";
      else if (sandboxTool === "searchPlaceIndexForPosition") mcpToolName = "grabmaps_search_place_index";

      const res = await fetch("/api/mcp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/event-stream"
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: Date.now(),
          method: "tools/call",
          params: {
            name: mcpToolName,
            arguments: parsed
          }
        })
      });

      const data = await res.json();
      setSandboxResult(data);
    } catch (err: any) {
      setSandboxResult({ error: err.message });
    } finally {
      setSandboxLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      {/* MCP Protocol Infrastructure Header */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 p-6 shadow-2xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-500/30">
                <Radio className="h-4 w-4 animate-pulse" />
              </span>
              <span className="text-xs font-mono font-bold tracking-widest text-indigo-400 uppercase">
                MODEL CONTEXT PROTOCOL (MCP 2025-11-25)
              </span>
            </div>
            <h2 className="text-xl font-black text-white sm:text-2xl">
              Taxi Question & Answer Intelligence
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Powered exclusively by <strong className="text-amber-400">3 official MCP Servers</strong> (zero raw API calls). Reasoning across live weather forecasts, LTA traffic & station crowd forecasts, and GrabMaps route navigation.
            </p>
          </div>

          {/* 3 Active MCP Servers Badges */}
          <div className="flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 text-xs">
            <div className="font-bold text-slate-300 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Active MCP Servers in Pipeline:</span>
            </div>
            <div className="space-y-1 text-[11px]">
              <div className="flex items-center justify-between gap-4 font-mono text-slate-300">
                <span className="text-amber-400">1. Singapore LTA DataMall MCP</span>
                <span className="text-emerald-400 text-[10px]">traffic_incidents, station_crowd</span>
              </div>
              <div className="flex items-center justify-between gap-4 font-mono text-slate-300">
                <span className="text-sky-400">2. Weather MCP Server</span>
                <span className="text-emerald-400 text-[10px]">get_weather_byDateTimeRange</span>
              </div>
              <div className="flex items-center justify-between gap-4 font-mono text-slate-300">
                <span className="text-emerald-400">3. GrabMaps MCP Server</span>
                <span className="text-emerald-400 text-[10px]">calculateRoute, searchPlaceIndex</span>
              </div>
            </div>
          </div>
        </div>

        {/* Input Bar Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="mt-6 flex flex-col gap-3"
        >
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-1 w-full">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask in natural language (e.g. 'Where should I head in Central given rain and traffic incidents?')..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white placeholder-slate-400 shadow-inner focus:border-indigo-500 focus:outline-none transition-all"
              />
            </div>

            {/* Optional Location input */}
            <div className="w-full sm:w-56">
              <input
                type="text"
                value={driverLocation}
                onChange={(e) => setDriverLocation(e.target.value)}
                placeholder="My Location (e.g. Orchard / Jurong)"
                className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-3 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 py-3 font-bold text-slate-950 shadow-lg shadow-amber-500/20 hover:bg-amber-400 disabled:opacity-50 transition-all text-sm shrink-0"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                  <span>Invoking MCPs...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Run MCP Pipeline</span>
                </>
              )}
            </button>
          </div>

          {/* Quick sample prompt chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
              <Lightbulb className="h-3 w-3 text-amber-400" />
              Quick Driver Questions:
            </span>
            {SAMPLE_QUESTIONS.map((sq, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setQuestion(sq);
                  handleSubmit(sq);
                }}
                className="rounded-lg border border-slate-700/60 bg-slate-850/80 px-2.5 py-1 text-[11px] text-slate-300 hover:border-indigo-400 hover:text-white transition-colors"
              >
                {sq}
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-950/30 p-4 text-xs text-red-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Results Container */}
      {qaResponse && (
        <div className="space-y-6">
          {/* 1. Tactical Driver Verdict Card */}
          <div className="rounded-2xl border-2 border-amber-500/60 bg-slate-900 p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-amber-400 uppercase tracking-wider">
                <CheckCircle2 className="h-4 w-4 text-amber-400" />
                <span>Tactical Dispatch Verdict (Synthesized across 3 MCP Servers)</span>
              </div>
              <span className="rounded-full bg-slate-800 px-2.5 py-0.5 font-mono text-[10px] text-slate-400">
                Pipeline execution: {qaResponse.total_execution_time_ms} ms
              </span>
            </div>
            <p className="mt-2 text-base sm:text-lg font-semibold text-white leading-relaxed">
              {qaResponse.synthesized_answer}
            </p>
          </div>

          {/* 2. MCP Server Execution Pipeline & Tool Calls Visualizer */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-indigo-400" />
                  <span>MCP Protocol Tool Calls Executed ({qaResponse.mcp_call_logs.length} calls)</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Click any tool invocation below to inspect the raw JSON-RPC 2.0 request and response payloads.
                </p>
              </div>
              <span className="rounded-md bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-400">
                STREAMABLE HTTP 200 OK
              </span>
            </div>

            {/* MCP Call Step Cards */}
            <div className="space-y-2">
              {qaResponse.mcp_call_logs.map((log, idx) => {
                const isExpanded = expandedLogIdx === idx;
                const isWeather = log.server.includes("Weather");
                const isLta = log.server.includes("LTA");
                const isGrab = log.server.includes("GrabMaps");

                const badgeBg = isWeather
                  ? "bg-sky-500/20 text-sky-400 border-sky-500/30"
                  : isLta
                  ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                  : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";

                return (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-800 bg-slate-950/60 transition-all overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedLogIdx(isExpanded ? null : idx)}
                      className="w-full flex items-center justify-between p-3 text-left hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-800 font-mono text-[11px] font-bold text-slate-300">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-white">
                              {log.tool}
                            </span>
                            <span className={`rounded-md border px-2 py-0.5 font-mono text-[9px] font-bold ${badgeBg}`}>
                              {log.server}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono">
                            method: "tools/call" • {log.latency_ms} ms
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-slate-400">
                        <span className="text-[10px] font-mono text-indigo-400">
                          {isExpanded ? "Hide JSON-RPC" : "Inspect Payload"}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </button>

                    {/* Expandable JSON-RPC Inspector */}
                    {isExpanded && (
                      <div className="border-t border-slate-800 bg-slate-950 p-4 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* Request */}
                          <div>
                            <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                              <Code className="h-3 w-3 text-amber-400" />
                              <span>JSON-RPC Request to {log.server}</span>
                            </div>
                            <pre className="max-h-56 overflow-auto rounded-lg bg-slate-900 p-2.5 font-mono text-[10px] text-amber-300 leading-relaxed border border-slate-800">
                              {JSON.stringify(log.request, null, 2)}
                            </pre>
                          </div>

                          {/* Response */}
                          <div>
                            <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                              <span>JSON-RPC Response Received</span>
                            </div>
                            <pre className="max-h-56 overflow-auto rounded-lg bg-slate-900 p-2.5 font-mono text-[10px] text-cyan-300 leading-relaxed border border-slate-800">
                              {JSON.stringify(log.response, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Three-Pillar Reasoning Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Pillar 1: Weather MCP Server */}
            <div className="rounded-2xl border border-sky-500/30 bg-slate-900/90 p-4 shadow-xl space-y-2">
              <div className="flex items-center gap-2 text-sky-400 font-bold text-xs uppercase tracking-wider font-mono">
                <CloudRain className="h-4 w-4" />
                <span>Weather MCP Analysis</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {qaResponse.reasoning_breakdown.weather_mcp_analysis}
              </p>
              <div className="rounded-lg bg-sky-950/40 border border-sky-800/30 p-2 text-[10px] text-sky-200">
                <strong>Tool:</strong> <code>get_weather_byDateTimeRange</code>
              </div>
            </div>

            {/* Pillar 2: Singapore LTA DataMall MCP Server */}
            <div className="rounded-2xl border border-amber-500/30 bg-slate-900/90 p-4 shadow-xl space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider font-mono">
                <Users className="h-4 w-4" />
                <span>LTA DataMall MCP Analysis</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {qaResponse.reasoning_breakdown.lta_datamall_mcp_analysis}
              </p>
              <div className="rounded-lg bg-amber-950/40 border border-amber-800/30 p-2 text-[10px] text-amber-200">
                <strong>Tools:</strong> <code>traffic_incidents</code>, <code>station_crowd_forecast</code>
              </div>
            </div>

            {/* Pillar 3: GrabMaps MCP Server */}
            <div className="rounded-2xl border border-emerald-500/30 bg-slate-900/90 p-4 shadow-xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider font-mono">
                <Route className="h-4 w-4" />
                <span>GrabMaps MCP Routing</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {qaResponse.reasoning_breakdown.grabmaps_mcp_routing}
              </p>
              <div className="rounded-lg bg-emerald-950/40 border border-emerald-800/30 p-2 text-[10px] text-emerald-200">
                <strong>Tools:</strong> <code>calculateRoute</code>, <code>searchPlaceIndexForPosition</code>
              </div>
            </div>
          </div>

          {/* 4. Target Pickup Stand & GrabMaps Route Summary Card */}
          {qaResponse.primary_target_pickup && (
            <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/30 p-5 shadow-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-emerald-500 px-2 py-0.5 text-[10px] font-black text-slate-950 uppercase">
                      RESOLVED PICKUP BAY
                    </span>
                    <span className="font-mono text-xs text-emerald-400">
                      {qaResponse.primary_target_pickup.station_code}
                    </span>
                  </div>
                  <h3 className="mt-1 text-lg font-bold text-white">
                    {qaResponse.primary_target_pickup.name}
                  </h3>
                  <p className="text-xs text-slate-300">
                    {qaResponse.primary_target_pickup.address}
                  </p>
                </div>

                {/* Plot on OneMap button */}
                <button
                  type="button"
                  onClick={() => {
                    if (onPlotRouteOnOneMap && qaResponse.primary_target_pickup) {
                      onPlotRouteOnOneMap({
                        name: qaResponse.primary_target_pickup.name,
                        coordinates: qaResponse.primary_target_pickup.coordinates,
                        route_summary: qaResponse.primary_target_pickup.route_summary,
                        waypoints: qaResponse.primary_target_pickup.navigation_waypoints,
                        incidents: qaResponse.traffic_incidents_alert || []
                      });
                    }
                  }}
                  className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-all shrink-0"
                >
                  <Navigation className="h-4 w-4" />
                  <span>Plot Route on SLA OneMap</span>
                </button>
              </div>

              {/* Route Summary Metrics Grid */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="rounded-xl bg-slate-950/80 p-3 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-mono">Distance (GrabMaps)</span>
                  <span className="font-bold text-white text-sm">
                    {qaResponse.primary_target_pickup.route_summary.distance_km} km
                  </span>
                </div>
                <div className="rounded-xl bg-slate-950/80 p-3 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-mono">Driving Duration & ETA</span>
                  <span className="font-bold text-amber-400 text-sm">
                    ~{qaResponse.primary_target_pickup.route_summary.estimated_duration_minutes} mins (ETA {qaResponse.primary_target_pickup.route_summary.eta_timestamp})
                  </span>
                </div>
                <div className="rounded-xl bg-slate-950/80 p-3 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-mono">Station Commuters (LTA)</span>
                  <span className="font-bold text-cyan-300 text-sm">
                    {qaResponse.primary_target_pickup.commuters_waiting} pax ({qaResponse.primary_target_pickup.taxi_switch_probability} switch)
                  </span>
                </div>
                <div className="rounded-xl bg-slate-950/80 p-3 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-mono">Approach Lane Advice</span>
                  <span className="font-semibold text-slate-200 text-[11px] truncate block">
                    {qaResponse.primary_target_pickup.route_summary.recommended_lane}
                  </span>
                </div>
              </div>

              {/* Live Traffic Incidents on Route */}
              {qaResponse.traffic_incidents_alert?.length > 0 && (
                <div className="mt-4 rounded-xl border border-red-500/30 bg-red-950/20 p-3 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-red-400 text-xs font-bold font-mono">
                    <ShieldAlert className="h-4 w-4" />
                    <span>LTA Traffic Incidents Alert along Travel Corridors:</span>
                  </div>
                  {qaResponse.traffic_incidents_alert.map((inc) => (
                    <div key={inc.id} className="text-[11px] text-slate-300 flex items-start gap-1.5">
                      <span className="text-red-400 font-bold">•</span>
                      <span>
                        <strong className="text-white">[{inc.expressway}]</strong> {inc.message} - <em className="text-amber-300">{inc.driver_impact}</em>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Direct MCP Sandbox Testing Console */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-amber-400" />
            <h4 className="text-sm font-bold text-white">Direct MCP Tool Execution Sandbox</h4>
          </div>
          <button
            type="button"
            onClick={() => setShowMcpSandbox(!showMcpSandbox)}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-mono"
          >
            {showMcpSandbox ? "Hide Sandbox" : "Open Tool Sandbox"}
          </button>
        </div>

        {showMcpSandbox && (
          <div className="pt-3 border-t border-slate-800 space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 font-mono block mb-1">Target MCP Server:</label>
                <select
                  value={sandboxServer}
                  onChange={(e) => {
                    const s = e.target.value as any;
                    setSandboxServer(s);
                    if (s === "lta") setSandboxTool("traffic_incidents");
                    else if (s === "weather") setSandboxTool("get_weather_byDateTimeRange");
                    else setSandboxTool("calculateRoute");
                  }}
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 p-2 text-white font-mono text-xs"
                >
                  <option value="lta">Singapore LTA DataMall MCP Server</option>
                  <option value="weather">Weather MCP Server</option>
                  <option value="grabmaps">GrabMaps MCP Server</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-mono block mb-1">Tool:</label>
                <select
                  value={sandboxTool}
                  onChange={(e) => setSandboxTool(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 p-2 text-white font-mono text-xs"
                >
                  {sandboxServer === "lta" && (
                    <>
                      <option value="traffic_incidents">traffic_incidents</option>
                      <option value="station_crowd_forecast">station_crowd_forecast</option>
                    </>
                  )}
                  {sandboxServer === "weather" && (
                    <option value="get_weather_byDateTimeRange">get_weather_byDateTimeRange</option>
                  )}
                  {sandboxServer === "grabmaps" && (
                    <>
                      <option value="calculateRoute">calculateRoute</option>
                      <option value="searchPlaceIndexForPosition">searchPlaceIndexForPosition</option>
                    </>
                  )}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleRunSandbox}
                  disabled={sandboxLoading}
                  className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 p-2 font-bold text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>{sandboxLoading ? "Calling..." : "Execute MCP Tool"}</span>
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-mono block mb-1">Arguments (JSON):</label>
              <input
                type="text"
                value={sandboxArgs}
                onChange={(e) => setSandboxArgs(e.target.value)}
                placeholder='e.g. {"expressway": "CTE"} or {"query": "Orchard"}'
                className="w-full rounded-lg bg-slate-950 border border-slate-800 p-2 text-amber-300 font-mono text-xs"
              />
            </div>

            {sandboxResult && (
              <pre className="max-h-60 overflow-auto rounded-lg bg-slate-950 p-3 font-mono text-[10px] text-cyan-300 border border-slate-800">
                {JSON.stringify(sandboxResult, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
