/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { Navbar } from "./components/Navbar";
import { OneMapViewer } from "./components/OneMapViewer";
import { HotspotsPanel } from "./components/HotspotsPanel";
import { QAPage } from "./components/QAPage";
import { WeatherTransitFeed } from "./components/WeatherTransitFeed";
import { EventsPanel } from "./components/EventsPanel";
import { McpInspector } from "./components/McpInspector";
import {
  HotspotItem,
  BusStopItem,
  WeatherForecastItem,
  MajorEventItem,
  Coordinates
} from "./types";
import {
  Car,
  CloudRain,
  Users,
  Compass,
  Sparkles,
  Layers,
  Radio,
  RefreshCw,
  AlertTriangle
} from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"map" | "qa" | "transit" | "events" | "mcp">("map");

  const [hotspots, setHotspots] = useState<HotspotItem[]>([]);
  const [busStops, setBusStops] = useState<BusStopItem[]>([]);
  const [weatherList, setWeatherList] = useState<WeatherForecastItem[]>([]);
  const [events, setEvents] = useState<MajorEventItem[]>([]);

  const [selectedHotspot, setSelectedHotspot] = useState<HotspotItem | null>(null);
  const [activeRoute, setActiveRoute] = useState<{
    name: string;
    coordinates: Coordinates;
    route_summary: any;
    waypoints: number[][];
    incidents: any[];
  } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialQAQuestion, setInitialQAQuestion] = useState("");

  const loadData = async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const [hRes, bRes, wRes, eRes] = await Promise.all([
        fetch("/api/hotspots?min_score=40").then((r) => (r.ok ? r.json() : null)),
        fetch("/api/bus-stops?region=all").then((r) => (r.ok ? r.json() : null)),
        fetch("/api/weather?area=all").then((r) => (r.ok ? r.json() : null)),
        fetch("/api/events?category=all").then((r) => (r.ok ? r.json() : null))
      ]);

      if (hRes?.top_hotspots) {
        setHotspots(hRes.top_hotspots);
        if (!selectedHotspot && hRes.top_hotspots.length > 0) {
          setSelectedHotspot(hRes.top_hotspots[0]);
        }
      }

      if (bRes?.bus_stops) {
        setBusStops(bRes.bus_stops);
      }

      if (wRes?.forecasts) {
        setWeatherList(wRes.forecasts);
      }

      if (eRes?.events) {
        setEvents(eRes.events);
      }
    } catch (err: any) {
      console.error("Failed to load initial transit data:", err);
      setError("Unable to connect to live Singapore transit services.");
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    // Auto-refresh every 60 seconds
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectHotspot = (h: HotspotItem | null) => {
    setSelectedHotspot(h);
    if (activeTab !== "map") {
      setActiveTab("map");
    }
  };

  const handleLocateBusStop = (stop: BusStopItem) => {
    const matched = hotspots.find((h) => h.id === `hotspot-${stop.stop_id}`);
    if (matched) {
      setSelectedHotspot(matched);
    } else {
      setSelectedHotspot({
        id: `bus-${stop.stop_id}`,
        name: stop.stop_name,
        location_title: `${stop.stop_name} (${stop.mrt_interchange})`,
        region: stop.region,
        demand_score: 75,
        demand_tier: "HIGH",
        coordinates: stop.coordinates,
        weather_status: "Partly Cloudy",
        weather_factor: "Weather factor contributing to commuter queue",
        bus_crowd_factor: `${stop.commuter_queue_count} waiting commuters`,
        event_factor: "Normal",
        taxi_conversion_rate: stop.switch_to_taxi_probability,
        recommended_pickup_bay: stop.recommended_taxi_stand,
        estimated_pickup_wait_mins: "2 - 3 mins",
        reasoning_synthesis: stop.taxi_reason
      });
    }
    setActiveTab("map");
  };

  const handleLocateEvent = (event: MajorEventItem) => {
    setSelectedHotspot({
      id: event.id,
      name: event.venue,
      location_title: event.name,
      region: "central",
      demand_score: 95,
      demand_tier: "SURGE_PEAK",
      coordinates: { latitude: event.latitude, longitude: event.longitude },
      weather_status: "High Event Influx",
      weather_factor: "Mass crowd exodus",
      bus_crowd_factor: "MRT & bus queues severely overloaded",
      event_factor: `${event.expected_attendance.toLocaleString()} attendees (${event.time_window})`,
      taxi_conversion_rate: "95% seeking immediate taxis",
      recommended_pickup_bay: event.recommended_pickup_bays[0],
      estimated_pickup_wait_mins: "< 1 min",
      reasoning_synthesis: event.commuter_impact
    });
    setActiveTab("map");
  };

  const handleSwitchToQA = (question: string) => {
    setInitialQAQuestion(question);
    setActiveTab("qa");
  };

  const rainCount = weatherList.filter((w) => w.is_rain).length;
  const crowdedBusStopCount = busStops.filter((b) => b.crowd_level === "severe" || b.crowd_level === "high").length;

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 font-sans text-slate-100">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        rainCount={rainCount}
        crowdedBusStopCount={crowdedBusStopCount}
        hotspotCount={hotspots.length}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* TAB 1: SLA Map & Hotspots */}
        {activeTab === "map" && (
          <div className="mx-auto flex h-[calc(100vh-65px)] max-w-7xl flex-col p-3 sm:p-4 gap-3">
            {/* Quick Driver Banner */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-2 text-xs">
              <div className="flex items-center gap-3">
                <span className="font-bold text-amber-400 flex items-center gap-1.5">
                  <Car className="h-4 w-4" />
                  <span>TAXI DRIVER ADVISORY:</span>
                </span>
                <span className="text-slate-300 hidden sm:inline">
                  Criteria 1: {rainCount > 0 ? `Rain detected in ${rainCount} areas (1.8x surge)` : "Cloudy overcast skies increase taxi hail 1.4x"}. Criteria 2: {crowdedBusStopCount} heavily congested bus stops.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={loadData}
                  disabled={isRefreshing}
                  className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-white"
                >
                  <RefreshCw className={`h-3 w-3 ${isRefreshing ? "animate-spin text-amber-400" : ""}`} />
                  <span>Auto-Synced</span>
                </button>
              </div>
            </div>

            {/* Split View: Map & Rankings */}
            <div className="grid flex-1 grid-cols-1 lg:grid-cols-12 gap-3 min-h-0">
              {/* Left SLA OneMap (7 cols) */}
              <div className="lg:col-span-7 h-[420px] lg:h-full">
                <OneMapViewer
                  hotspots={hotspots}
                  busStops={busStops}
                  weatherList={weatherList}
                  events={events}
                  selectedHotspot={selectedHotspot}
                  onSelectHotspot={setSelectedHotspot}
                  activeRoute={activeRoute}
                  onClearRoute={() => setActiveRoute(null)}
                />
              </div>

              {/* Right Rankings Panel (5 cols) */}
              <div className="lg:col-span-5 h-[450px] lg:h-full">
                <HotspotsPanel
                  hotspots={hotspots}
                  selectedHotspot={selectedHotspot}
                  onSelectHotspot={handleSelectHotspot}
                  onSwitchToQA={handleSwitchToQA}
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Driver Q&A Reasoning Page (Utilizing 3 MCP Servers) */}
        {activeTab === "qa" && (
          <QAPage
            onPlotRouteOnOneMap={(routeData) => {
              setActiveRoute(routeData);
              setActiveTab("map");
            }}
            initialQuestion={initialQAQuestion}
          />
        )}

        {/* TAB 3: Weather & Bus Congestion Feed */}
        {activeTab === "transit" && (
          <WeatherTransitFeed
            weatherList={weatherList}
            busStops={busStops}
            onRefresh={loadData}
            isRefreshing={isRefreshing}
            onLocateBusStop={handleLocateBusStop}
          />
        )}

        {/* TAB 4: Events & Concerts */}
        {activeTab === "events" && (
          <EventsPanel events={events} onLocateEvent={handleLocateEvent} />
        )}

        {/* TAB 5: MCP Server Explorer */}
        {activeTab === "mcp" && <McpInspector />}
      </main>
    </div>
  );
}
