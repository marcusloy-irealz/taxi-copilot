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
  Navigation
} from "lucide-react";
import { HotspotItem, TaxiReasoningResult } from "../types";

interface QAPageProps {
  onSelectHotspotForMap: (h: HotspotItem) => void;
  initialQuestion?: string;
}

const SAMPLE_QUESTIONS = [
  "Where should I head right now in Central area given the cloudy weather?",
  "Are commuters stranded at bus stops around Jurong East or Clementi?",
  "Any major concerts or events ending tonight in Singapore?",
  "Why is Orchard / Somerset experiencing high taxi demand?",
  "Which bus interchanges in the North (Woodlands/Yishun) have longest queues?",
  "Is Changi Airport or Marina Bay Sands seeing bigger passenger surge right now?"
];

export const QAPage: React.FC<QAPageProps> = ({
  onSelectHotspotForMap,
  initialQuestion = ""
}) => {
  const [question, setQuestion] = useState(initialQuestion);
  const [driverLocation, setDriverLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [reasoningResult, setReasoningResult] = useState<TaxiReasoningResult | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        throw new Error(`Reasoning service responded with status ${res.status}`);
      }

      const data = await res.json();
      setReasoningResult(data);
    } catch (err: any) {
      console.error("QA Error:", err);
      setError(err.message || "Failed to reason taxi query.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/40 p-6 shadow-2xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-slate-950 font-black">
                <Sparkles className="h-4 w-4" />
              </span>
              <span className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase">
                TAXI DISPATCH COPILOT & REASONING
              </span>
            </div>
            <h2 className="text-xl font-black text-white sm:text-2xl">
              Natural Language Taxi Dispatch Advisor
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              Ask anything about Singapore weather impacts (Criteria 1), crowded bus stops (Criteria 2), concert dismissals, or best SLA OneMap pickup bays.
            </p>
          </div>

          <div className="flex flex-col gap-1.5 rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-[11px]">
            <span className="font-bold text-amber-400">⚡ Reasoning Engine Features:</span>
            <span className="text-slate-300">✓ Criteria 1: NEA 2-hour rain/cloudy detection</span>
            <span className="text-slate-300">✓ Criteria 2: LTA bus stop crowd modal-shift</span>
            <span className="text-slate-300">✓ SLA OneMap georeferencing & pickup bays</span>
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
                placeholder="Ask in natural language (e.g. 'Where should I head right now in Central given the rainy weather?')..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white placeholder-slate-400 shadow-inner focus:border-amber-500 focus:outline-none transition-all"
              />
            </div>

            {/* Optional Location input */}
            <div className="w-full sm:w-52">
              <input
                type="text"
                value={driverLocation}
                onChange={(e) => setDriverLocation(e.target.value)}
                placeholder="My Location (e.g. Orchard)"
                className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-3 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none transition-all"
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
                  <span>Reasoning...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Ask Dispatch AI</span>
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
                className="rounded-lg border border-slate-700/60 bg-slate-850/80 px-2.5 py-1 text-[11px] text-slate-300 hover:border-amber-500 hover:text-white transition-colors"
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

      {/* Reasoning Results View */}
      {reasoningResult && (
        <div className="space-y-4">
          {/* Tactical Verdict Card */}
          <div className="rounded-2xl border-2 border-amber-500/60 bg-slate-900 p-5 shadow-2xl">
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-amber-400 uppercase tracking-wider">
              <CheckCircle2 className="h-4 w-4 text-amber-400" />
              <span>Tactical Driver Verdict</span>
            </div>
            <p className="mt-2 text-base sm:text-lg font-semibold text-white leading-relaxed">
              {reasoningResult.tactical_summary}
            </p>
          </div>

          {/* Dual Criteria Deep Reasoning Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Criteria 1: Weather Reasoning */}
            <div className="rounded-2xl border border-sky-500/30 bg-slate-900/90 p-5 shadow-xl">
              <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
                <CloudRain className="h-4 w-4" />
                <span>Criteria 1: Weather Impact (Cloudy / Rain)</span>
              </div>
              <p className="mt-2.5 text-xs text-slate-300 leading-relaxed">
                {reasoningResult.criteria_1_weather_analysis}
              </p>
              <div className="mt-3 rounded-xl bg-sky-950/40 border border-sky-800/30 p-3 text-[11px] text-sky-200">
                💡 <strong>Driver Rule:</strong> When weather is cloudy or raining, pedestrians avoid walking 5+ minutes to open bus stops or MRT stations and instantly look for sheltered taxi stands.
              </div>
            </div>

            {/* Criteria 2: Bus Stop Crowding Reasoning */}
            <div className="rounded-2xl border border-amber-500/30 bg-slate-900/90 p-5 shadow-xl">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <Users className="h-4 w-4" />
                <span>Criteria 2: Bus Stop Congestion & Commuter Switch</span>
              </div>
              <p className="mt-2.5 text-xs text-slate-300 leading-relaxed">
                {reasoningResult.criteria_2_bus_crowd_analysis}
              </p>
              <div className="mt-3 rounded-xl bg-amber-950/40 border border-amber-800/30 p-3 text-[11px] text-amber-200">
                💡 <strong>Driver Rule:</strong> When feeder buses are full or queues exceed 60+ pax, commuters group together or switch immediately to taxis. Position your vehicle near the designated mall taxi bay.
              </div>
            </div>
          </div>

          {/* Target Dispatch Destination Card (Primary Target) */}
          {reasoningResult.primary_target && (
            <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/20 p-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <span className="rounded-md bg-emerald-500 px-2 py-0.5 text-[10px] font-black text-slate-950 uppercase">
                    PRIMARY SLA ONEMAP TARGET
                  </span>
                  <h3 className="mt-1.5 text-lg font-bold text-white">
                    {reasoningResult.primary_target.name}
                  </h3>
                  <p className="text-xs text-slate-300">
                    {reasoningResult.primary_target.location_title}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-slate-900/80 border border-emerald-500/30 p-2.5 text-center">
                    <div className="text-[10px] text-slate-400">Demand Score</div>
                    <div className="font-mono text-base font-black text-amber-400">
                      {reasoningResult.primary_target.demand_score}/100
                    </div>
                  </div>
                  <button
                    onClick={() => onSelectHotspotForMap(reasoningResult.primary_target)}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-colors"
                  >
                    <Navigation className="h-4 w-4" />
                    <span>View on SLA OneMap</span>
                  </button>
                </div>
              </div>

              {/* Bay & Wait times */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="rounded-lg bg-slate-900/80 p-2.5 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Recommended Pickup Bay:</span>
                  <span className="font-semibold text-emerald-300">{reasoningResult.primary_target.recommended_pickup_bay}</span>
                </div>
                <div className="rounded-lg bg-slate-900/80 p-2.5 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Est. Passenger Wait:</span>
                  <span className="font-semibold text-amber-400">{reasoningResult.primary_target.estimated_pickup_wait_mins}</span>
                </div>
                <div className="rounded-lg bg-slate-900/80 p-2.5 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Taxi Conversion Rate:</span>
                  <span className="font-semibold text-sky-300">{reasoningResult.primary_target.taxi_conversion_rate}</span>
                </div>
              </div>
            </div>
          )}

          {/* Tactical Driving Tips & Alternative Hotspots */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tips */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Compass className="h-3.5 w-3.5" />
                <span>Tactical Driver Navigation Tips</span>
              </h4>
              <ul className="mt-3 space-y-2 text-xs text-slate-300">
                {reasoningResult.driver_tactical_tips?.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Alternative Zones */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-amber-400" />
                <span>Alternative Nearby Hotspots</span>
              </h4>
              <div className="mt-3 space-y-2">
                {reasoningResult.alternative_hotspots?.map((alt) => (
                  <div
                    key={alt.id}
                    onClick={() => onSelectHotspotForMap(alt)}
                    className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-950/60 p-2.5 hover:border-amber-500/50 cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-xs text-white">{alt.name}</div>
                      <div className="text-[10px] text-slate-400">{alt.recommended_pickup_bay}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-amber-500/20 px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-400">
                        {alt.demand_score}
                      </span>
                      <Navigation className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
