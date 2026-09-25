import React from "react";
import { CalendarDays, Users, Flame, Navigation, Clock, MapPin } from "lucide-react";
import { MajorEventItem } from "../types";

interface EventsPanelProps {
  events: MajorEventItem[];
  onLocateEvent: (event: MajorEventItem) => void;
}

export const EventsPanel: React.FC<EventsPanelProps> = ({ events, onLocateEvent }) => {
  return (
    <div className="mx-auto max-w-5xl space-y-5 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400">
              <CalendarDays className="h-4 w-4" />
            </span>
            <span className="text-xs font-mono font-bold tracking-widest text-purple-400 uppercase">
              SINGAPORE EVENT SURGE MONITOR
            </span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1">
            Major Concerts, Stadiums & Conventions
          </h2>
          <p className="text-xs text-slate-400">
            Dispersal schedules generating mass passenger taxi queues
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-purple-500/10 px-3 py-1 text-xs font-mono font-bold text-purple-300 border border-purple-500/20">
            {events.length} Major Active Venues
          </span>
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {events.map((e) => (
          <div
            key={e.id}
            className="flex flex-col justify-between rounded-2xl border border-purple-500/30 bg-slate-900/90 p-5 shadow-xl hover:border-purple-500/60 transition-all"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <span className="rounded-md bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-300 border border-purple-500/30">
                  {e.category}
                </span>
                <span className="flex items-center gap-1 rounded-md bg-amber-500 px-2 py-0.5 text-[10px] font-black text-slate-950">
                  <Flame className="h-3 w-3 fill-current" />
                  {e.taxi_surge_factor}
                </span>
              </div>

              <h3 className="mt-2 text-base font-bold text-white leading-snug">{e.name}</h3>
              <p className="text-xs text-purple-300 font-medium mt-0.5">{e.venue}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{e.address}</p>

              {/* Stats Bar */}
              <div className="mt-3.5 grid grid-cols-2 gap-2 rounded-xl bg-slate-950/70 p-2.5 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block">Expected Crowd</span>
                  <span className="font-bold text-white">
                    {e.expected_attendance.toLocaleString()} attendees
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Surge Window</span>
                  <span className="font-bold text-amber-400">{e.time_window}</span>
                </div>
              </div>

              <p className="mt-3 text-xs text-slate-300 leading-relaxed">{e.commuter_impact}</p>

              {/* Recommended Pickup bays */}
              <div className="mt-3 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Recommended Pickup Bays:
                </span>
                <div className="space-y-1">
                  {e.recommended_pickup_bays.map((bay, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg bg-slate-800/80 px-2.5 py-1 text-[11px] text-emerald-300 border border-slate-700/60"
                    >
                      📍 {bay}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-end">
              <button
                onClick={() => onLocateEvent(e)}
                className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-500 shadow-md transition-colors"
              >
                <Navigation className="h-3.5 w-3.5" />
                <span>Locate on SLA OneMap</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
