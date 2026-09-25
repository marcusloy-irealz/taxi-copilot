import React, { useState } from "react";
import {
  CloudRain,
  Users,
  Compass,
  MapPin,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Sun,
  Cloud
} from "lucide-react";
import { WeatherForecastItem, BusStopItem } from "../types";

interface WeatherTransitFeedProps {
  weatherList: WeatherForecastItem[];
  busStops: BusStopItem[];
  onRefresh: () => void;
  isRefreshing: boolean;
  onLocateBusStop: (stop: BusStopItem) => void;
}

export const WeatherTransitFeed: React.FC<WeatherTransitFeedProps> = ({
  weatherList,
  busStops,
  onRefresh,
  isRefreshing,
  onLocateBusStop
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"both" | "weather" | "bus">("both");
  const [regionFilter, setRegionFilter] = useState("all");

  const rainyOrCloudyWeather = weatherList.filter((w) => {
    if (regionFilter !== "all") {
      // Rough filter
      return true;
    }
    return true;
  });

  const filteredBusStops = busStops.filter((b) => {
    if (regionFilter !== "all" && b.region.toLowerCase() !== regionFilter.toLowerCase()) {
      return false;
    }
    return true;
  });

  return (
    <div className="mx-auto max-w-6xl space-y-5 p-4 sm:p-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>Criteria Feeds: NEA Weather & LTA Bus Crowds</span>
          </h2>
          <p className="text-xs text-slate-400">
            Real-time sensory feeds driving Singapore taxi demand algorithms
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sub-tab picker */}
          <div className="flex rounded-xl border border-slate-800 bg-slate-900 p-1 text-xs">
            <button
              onClick={() => setActiveSubTab("both")}
              className={`rounded-lg px-2.5 py-1 font-semibold ${
                activeSubTab === "both" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-white"
              }`}
            >
              Both
            </button>
            <button
              onClick={() => setActiveSubTab("weather")}
              className={`rounded-lg px-2.5 py-1 font-semibold ${
                activeSubTab === "weather" ? "bg-sky-500 text-slate-950" : "text-slate-400 hover:text-white"
              }`}
            >
              🌧️ Criteria 1 (Weather)
            </button>
            <button
              onClick={() => setActiveSubTab("bus")}
              className={`rounded-lg px-2.5 py-1 font-semibold ${
                activeSubTab === "bus" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              🚏 Criteria 2 (Bus Stops)
            </button>
          </div>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-amber-400" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Region selector bar */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <span className="text-slate-400 text-[11px] font-semibold mr-1">Region:</span>
        {["all", "central", "west", "east", "north", "north-east"].map((r) => (
          <button
            key={r}
            onClick={() => setRegionFilter(r)}
            className={`rounded-lg px-2.5 py-1 font-semibold uppercase tracking-wider text-[11px] transition-all ${
              regionFilter === r
                ? "bg-amber-500 text-slate-950 font-bold shadow"
                : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Grid of Two Criteria */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Criteria 1: Weather Column */}
        {(activeSubTab === "both" || activeSubTab === "weather") && (
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-sky-500/30 bg-sky-950/20 p-3.5">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400">
                  <CloudRain className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-sky-300">
                    Criteria 1: Singapore 2-Hour Weather
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Upstream: data.gov.sg NEA 2-Hour Forecast
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-sky-500/20 px-2.5 py-0.5 text-xs font-mono font-bold text-sky-300">
                {rainyOrCloudyWeather.length} Areas
              </span>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {rainyOrCloudyWeather.map((w, idx) => {
                const isRain = w.is_rain;
                const isCloudy = w.is_cloudy;
                return (
                  <div
                    key={idx}
                    className={`rounded-xl border p-3 transition-all ${
                      isRain
                        ? "border-sky-500/50 bg-sky-950/30 shadow-md shadow-sky-950/30"
                        : isCloudy
                        ? "border-slate-700 bg-slate-900/80"
                        : "border-slate-800/80 bg-slate-950/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{isRain ? "🌧️" : isCloudy ? "☁️" : "☀️"}</span>
                        <span className="font-bold text-sm text-white">{w.area}</span>
                      </div>
                      <span
                        className={`rounded px-2 py-0.5 font-mono text-[10px] font-black ${
                          isRain
                            ? "bg-sky-500 text-slate-950"
                            : isCloudy
                            ? "bg-slate-700 text-slate-200"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {w.demand_multiplier}x SURGE
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-sky-200 font-medium">{w.forecast}</p>
                    <p className="mt-1 text-[11px] text-slate-400">{w.driver_advice}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Criteria 2: Bus Stops Column */}
        {(activeSubTab === "both" || activeSubTab === "bus") && (
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-950/20 p-3.5">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-amber-300">
                    Criteria 2: Crowded Bus Stops (Modal Shift)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Upstream: Singapore LTA DataMall
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-mono font-bold text-amber-300">
                {filteredBusStops.length} Hubs
              </span>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {filteredBusStops.map((b) => {
                const isSevere = b.crowd_level === "severe";
                return (
                  <div
                    key={b.stop_id}
                    className={`rounded-xl border p-3 transition-all ${
                      isSevere
                        ? "border-red-500/40 bg-red-950/20 shadow-md"
                        : "border-amber-500/30 bg-slate-900/80"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-white">{b.stop_name}</span>
                        <span className="rounded bg-slate-800 px-1.5 py-0.2 font-mono text-[9px] text-slate-400">
                          {b.region.toUpperCase()}
                        </span>
                      </div>
                      <span
                        className={`rounded px-2 py-0.5 font-mono text-[10px] font-black ${
                          isSevere ? "bg-red-500 text-slate-950" : "bg-amber-500 text-slate-950"
                        }`}
                      >
                        {b.commuter_queue_count} PAX
                      </span>
                    </div>

                    <div className="mt-1 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">{b.road_name}</span>
                      <span className="font-semibold text-amber-400">
                        {b.switch_to_taxi_probability} Taxi Switch
                      </span>
                    </div>

                    <p className="mt-1.5 text-[11px] text-slate-300 leading-relaxed">
                      {b.taxi_reason}
                    </p>

                    {/* Services and Taxi Bay */}
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 pt-2 text-[10px]">
                      <div className="flex items-center gap-1 text-slate-400">
                        <span>Services:</span>
                        <div className="flex gap-1">
                          {b.congested_bus_services.map((svc) => (
                            <span
                              key={svc}
                              className="rounded bg-slate-800 px-1 py-0.2 font-mono font-bold text-cyan-300"
                            >
                              {svc}
                            </span>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => onLocateBusStop(b)}
                        className="rounded-lg bg-amber-500/10 px-2 py-1 font-semibold text-amber-400 hover:bg-amber-500 hover:text-slate-950 transition-colors"
                      >
                        {b.recommended_taxi_stand}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
