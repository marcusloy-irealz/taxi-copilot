import React, { useState } from "react";
import {
  Flame,
  CloudRain,
  Users,
  Compass,
  MapPin,
  ChevronRight,
  TrendingUp,
  Clock,
  Sparkles
} from "lucide-react";
import { HotspotItem } from "../types";

interface HotspotsPanelProps {
  hotspots: HotspotItem[];
  selectedHotspot: HotspotItem | null;
  onSelectHotspot: (h: HotspotItem) => void;
  onSwitchToQA: (question: string) => void;
}

export const HotspotsPanel: React.FC<HotspotsPanelProps> = ({
  hotspots,
  selectedHotspot,
  onSelectHotspot,
  onSwitchToQA
}) => {
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [minScore, setMinScore] = useState<number>(50);

  const filtered = hotspots.filter((h) => {
    if (regionFilter !== "all" && h.region.toLowerCase() !== regionFilter.toLowerCase()) {
      return false;
    }
    if (h.demand_score < minScore) {
      return false;
    }
    return true;
  });

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl backdrop-blur-md">
      {/* Header */}
      <div className="border-b border-slate-800 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
              <Flame className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Live Taxi Surge Rankings</h2>
              <p className="text-[11px] text-slate-400">
                Ranked by Rain (Crit 1) & Bus Congestion (Crit 2)
              </p>
            </div>
          </div>
          <span className="rounded-full bg-amber-500/10 px-2 py-0.5 font-mono text-xs font-bold text-amber-400 border border-amber-500/20">
            {filtered.length} Zones
          </span>
        </div>

        {/* Region Filters */}
        <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
          {["all", "central", "west", "east", "north"].map((r) => (
            <button
              key={r}
              onClick={() => setRegionFilter(r)}
              className={`rounded-lg px-2.5 py-1 font-semibold uppercase tracking-wider transition-all ${
                regionFilter === r
                  ? "bg-amber-500 text-slate-950 shadow"
                  : "bg-slate-800/80 text-slate-400 hover:text-white"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No hotspots match the current filter.
          </div>
        ) : (
          filtered.map((h, idx) => {
            const isSelected = selectedHotspot?.id === h.id;
            const isPeak = h.demand_score >= 85;

            return (
              <div
                key={h.id}
                onClick={() => onSelectHotspot(h)}
                className={`group relative cursor-pointer rounded-xl border p-3 transition-all ${
                  isSelected
                    ? "border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10"
                    : "border-slate-800/90 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-800/50"
                }`}
              >
                {/* Ranking Pill & Score */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-800 font-mono text-[10px] font-bold text-slate-300">
                      #{idx + 1}
                    </span>
                    <span className="font-bold text-sm text-white group-hover:text-amber-400 transition-colors">
                      {h.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`rounded-md px-2 py-0.5 font-mono text-xs font-black ${
                        isPeak ? "bg-red-500 text-slate-950" : "bg-amber-500 text-slate-950"
                      }`}
                    >
                      {h.demand_score}
                    </span>
                  </div>
                </div>

                <p className="mt-1 text-[11px] text-slate-400 truncate">{h.location_title}</p>

                {/* Criteria Indicators */}
                <div className="mt-2.5 grid grid-cols-2 gap-1.5 text-[10px]">
                  {/* Weather */}
                  <div className="flex items-center gap-1 rounded-md bg-sky-950/40 border border-sky-800/30 px-2 py-1 text-sky-300">
                    <CloudRain className="h-3 w-3 shrink-0 text-sky-400" />
                    <span className="truncate">{h.weather_status}</span>
                  </div>

                  {/* Bus Stop Crowd */}
                  <div className="flex items-center gap-1 rounded-md bg-amber-950/40 border border-amber-800/30 px-2 py-1 text-amber-300">
                    <Users className="h-3 w-3 shrink-0 text-amber-400" />
                    <span className="truncate">{h.taxi_conversion_rate} taxi switch</span>
                  </div>
                </div>

                {/* Tactical Bay & Pickup Time */}
                <div className="mt-2 flex items-center justify-between border-t border-slate-800/80 pt-2 text-[10px]">
                  <span className="text-slate-400 truncate max-w-[200px]">
                    📍 {h.recommended_pickup_bay}
                  </span>
                  <span className="font-semibold text-emerald-400 shrink-0">
                    ⏱️ Wait {h.estimated_pickup_wait_mins}
                  </span>
                </div>

                {/* Quick Ask Copilot button */}
                <div className="mt-2 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSwitchToQA(`Why is ${h.name} marked as high taxi demand right now? What are the weather and bus crowd conditions?`);
                    }}
                    className="flex items-center gap-1 text-[10px] text-amber-400 hover:text-amber-300 underline font-medium"
                  >
                    <Sparkles className="h-2.5 w-2.5" />
                    <span>Ask Reasoning AI about this zone</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
