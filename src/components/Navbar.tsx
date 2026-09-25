import React, { useEffect, useState } from "react";
import {
  Car,
  CloudRain,
  Users,
  Compass,
  Sparkles,
  Layers,
  Radio,
  Clock,
  CalendarDays
} from "lucide-react";

interface NavbarProps {
  activeTab: "map" | "qa" | "transit" | "events" | "mcp";
  setActiveTab: (tab: "map" | "qa" | "transit" | "events" | "mcp") => void;
  rainCount: number;
  crowdedBusStopCount: number;
  hotspotCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  rainCount,
  crowdedBusStopCount,
  hotspotCount
}) => {
  const [sgTime, setSgTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Format in SGT
      const timeStr = now.toLocaleTimeString("en-SG", {
        timeZone: "Asia/Singapore",
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
      setSgTime(timeStr);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-900/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        {/* Brand & Driver Badge */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 font-black text-slate-950 shadow-lg shadow-amber-500/20">
            <Car className="h-6 w-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold tracking-widest text-amber-400">
                SG TAXI COPILOT
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LIVE RADAR
              </span>
            </div>
            <h1 className="text-sm font-semibold tracking-tight text-white sm:text-base">
              Demand & Reasoning Navigator
            </h1>
          </div>
        </div>

        {/* Live Criteria Monitor Status Bar */}
        <div className="hidden lg:flex items-center gap-2">
          {/* Criteria 1 */}
          <div className="flex items-center gap-1.5 rounded-lg border border-sky-500/30 bg-sky-950/40 px-2.5 py-1 text-xs">
            <CloudRain className="h-3.5 w-3.5 text-sky-400 animate-bounce" />
            <span className="text-slate-400">Criteria 1:</span>
            <span className="font-semibold text-sky-300">
              {rainCount > 0 ? `${rainCount} Wet Areas` : "Cloudy Overcast"}
            </span>
          </div>

          {/* Criteria 2 */}
          <div className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-950/40 px-2.5 py-1 text-xs">
            <Users className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-slate-400">Criteria 2:</span>
            <span className="font-semibold text-amber-300">
              {crowdedBusStopCount} Crowded Bus Stops
            </span>
          </div>

          {/* SLA OneMap */}
          <div className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-950/40 px-2.5 py-1 text-xs">
            <Layers className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-slate-400">Map:</span>
            <span className="font-semibold text-emerald-300">SLA OneMap</span>
          </div>

          {/* SGT Clock */}
          <div className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 font-mono text-xs text-amber-400">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span>SGT {sgTime || "21:45"}</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex flex-wrap items-center gap-1">
          <button
            onClick={() => setActiveTab("map")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              activeTab === "map"
                ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Compass className="h-3.5 w-3.5" />
            <span>SLA Map & Hotspots</span>
            {hotspotCount > 0 && (
              <span
                className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  activeTab === "map"
                    ? "bg-slate-950 text-amber-400"
                    : "bg-amber-500/20 text-amber-400"
                }`}
              >
                {hotspotCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("qa")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              activeTab === "qa"
                ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>Q&A (3 MCP Servers)</span>
          </button>

          <button
            onClick={() => setActiveTab("transit")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              activeTab === "transit"
                ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <CloudRain className="h-3.5 w-3.5" />
            <span>Weather & Bus Feed</span>
          </button>

          <button
            onClick={() => setActiveTab("events")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              activeTab === "events"
                ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <CalendarDays className="h-3.5 w-3.5" />
            <span>Concerts & Events</span>
          </button>

          <button
            onClick={() => setActiveTab("mcp")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              activeTab === "mcp"
                ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20"
                : "border border-indigo-500/30 text-indigo-300 hover:bg-indigo-950/50"
            }`}
          >
            <Radio className="h-3.5 w-3.5 animate-pulse" />
            <span>MCP Server (/api/mcp)</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
