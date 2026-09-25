import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import {
  MapPin,
  Search,
  Navigation,
  Layers,
  CloudRain,
  Users,
  Calendar,
  AlertTriangle,
  X,
  Compass
} from "lucide-react";
import { HotspotItem, BusStopItem, WeatherForecastItem, MajorEventItem, OneMapSearchResult, Coordinates } from "../types";

interface OneMapViewerProps {
  hotspots: HotspotItem[];
  busStops: BusStopItem[];
  weatherList: WeatherForecastItem[];
  events: MajorEventItem[];
  selectedHotspot: HotspotItem | null;
  onSelectHotspot: (h: HotspotItem | null) => void;
  activeRoute?: {
    name: string;
    coordinates: Coordinates;
    route_summary: any;
    waypoints: number[][];
    incidents: any[];
  } | null;
  onClearRoute?: () => void;
}

export const OneMapViewer: React.FC<OneMapViewerProps> = ({
  hotspots,
  busStops,
  weatherList,
  events,
  selectedHotspot,
  onSelectHotspot,
  activeRoute = null,
  onClearRoute
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);

  const [mapStyle, setMapStyle] = useState<"Night" | "Default" | "Grey">("Night");
  const [showHotspots, setShowHotspots] = useState(true);
  const [showBusStops, setShowBusStops] = useState(true);
  const [showWeather, setShowWeather] = useState(true);
  const [showEvents, setShowEvents] = useState(true);

  // Search SLA OneMap state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<OneMapSearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Singapore center: 1.3521, 103.8198
    const map = L.map(mapContainerRef.current, {
      center: [1.3521, 103.8198],
      zoom: 12,
      minZoom: 11,
      maxZoom: 18,
      zoomControl: false
    });

    // Add zoom control top right
    L.control.zoom({ position: "topright" }).addTo(map);

    // Initial SLA OneMap Tile Layer
    const tileUrl = `https://www.onemap.gov.sg/maps/tiles/${mapStyle}/{z}/{x}/{y}.png`;
    const tileLayer = L.tileLayer(tileUrl, {
      maxZoom: 18,
      minZoom: 11,
      attribution:
        '&copy; <a href="https://www.onemap.gov.sg/" target="_blank" rel="noreferrer">Singapore Land Authority (SLA) OneMap</a>'
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    // Group for markers
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    // Group for GrabMaps route and incidents
    const routeLayer = L.layerGroup().addTo(map);
    routeLayerRef.current = routeLayer;

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update map style when changed
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    tileLayerRef.current.setUrl(`https://www.onemap.gov.sg/maps/tiles/${mapStyle}/{z}/{x}/{y}.png`);
  }, [mapStyle]);

  // Update Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    const layer = markersLayerRef.current;
    layer.clearLayers();

    // 1. Hotspots Markers
    if (showHotspots) {
      hotspots.forEach((h) => {
        const isPeak = h.demand_score >= 85;
        const color = isPeak ? "#ef4444" : "#f59e0b";
        const badgeBg = isPeak ? "bg-red-500" : "bg-amber-500";

        // Animated pulsing pulse
        const iconHtml = `
          <div class="relative flex items-center justify-center cursor-pointer group">
            <span class="absolute -top-1 -right-1 flex h-4 w-4">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full ${badgeBg} opacity-75"></span>
              <span class="relative inline-flex rounded-full h-4 w-4 ${badgeBg} text-[9px] font-black text-slate-950 items-center justify-center">${h.demand_score}</span>
            </span>
            <div class="h-8 w-8 rounded-full border-2 border-white shadow-xl flex items-center justify-center ${badgeBg} text-slate-950">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 fill-current stroke-current" viewBox="0 0 24 24"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>
            </div>
          </div>
        `;

        const icon = L.divIcon({
          html: iconHtml,
          className: "custom-hotspot-pin",
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        });

        const marker = L.marker([h.coordinates.latitude, h.coordinates.longitude], { icon });
        marker.on("click", () => {
          onSelectHotspot(h);
        });

        // Radius demand circle
        const circle = L.circle([h.coordinates.latitude, h.coordinates.longitude], {
          radius: isPeak ? 650 : 450,
          color: color,
          fillColor: color,
          fillOpacity: 0.18,
          weight: 1.5
        });

        layer.addLayer(circle);
        layer.addLayer(marker);
      });
    }

    // 2. Crowded Bus Stops (Criteria 2)
    if (showBusStops) {
      busStops.forEach((b) => {
        const isSevere = b.crowd_level === "severe";
        const iconHtml = `
          <div class="relative flex items-center justify-center cursor-pointer">
            <div class="h-6 w-6 rounded-md bg-blue-600 border border-blue-300 text-white flex items-center justify-center text-[10px] font-bold shadow-md">
              BUS
            </div>
            <span class="absolute -bottom-2.5 rounded-full bg-slate-900 border border-blue-400 px-1 text-[8px] font-mono text-cyan-300 font-bold whitespace-nowrap shadow">
              ${b.commuter_queue_count} pax
            </span>
          </div>
        `;

        const icon = L.divIcon({
          html: iconHtml,
          className: "custom-bus-pin",
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        const marker = L.marker([b.coordinates.latitude, b.coordinates.longitude], { icon });
        marker.bindPopup(`
          <div class="p-1 font-sans text-slate-900 max-w-[240px]">
            <div class="flex items-center gap-1 font-bold text-xs text-blue-800">
              <span>🚏 ${b.stop_name}</span>
            </div>
            <p class="text-[11px] text-slate-700 mt-1"><strong>Queue:</strong> ${b.commuter_queue_count} waiting commuters (${b.crowd_level.toUpperCase()})</p>
            <p class="text-[11px] text-amber-700 mt-0.5"><strong>Taxi Switch Rate:</strong> ${b.switch_to_taxi_probability}</p>
            <p class="text-[11px] text-slate-600 mt-0.5"><strong>Taxi Stand:</strong> ${b.recommended_taxi_stand}</p>
          </div>
        `);
        layer.addLayer(marker);
      });
    }

    // 3. Rain & Weather Indicators (Criteria 1)
    if (showWeather) {
      weatherList
        .filter((w) => w.is_rain || w.is_cloudy)
        .slice(0, 15)
        .forEach((w) => {
          const isRain = w.is_rain;
          const bg = isRain ? "bg-sky-600 text-white" : "bg-slate-700 text-slate-200";
          const iconHtml = `
            <div class="flex items-center gap-1 rounded-full px-2 py-0.5 shadow-md text-[9px] font-semibold ${bg} border border-sky-300/40">
              <span>${isRain ? "🌧️" : "☁️"}</span>
              <span>${w.area}</span>
            </div>
          `;
          const icon = L.divIcon({
            html: iconHtml,
            className: "custom-weather-pin",
            iconSize: [80, 20],
            iconAnchor: [40, 10]
          });
          const marker = L.marker([w.coordinates.latitude, w.coordinates.longitude], { icon });
          marker.bindPopup(`
            <div class="p-1 font-sans text-slate-900 text-xs">
              <strong class="text-sky-700">${w.area} Weather (Criteria 1)</strong>
              <p class="mt-1">${w.forecast}</p>
              <p class="text-amber-700 font-semibold mt-1">${w.driver_advice}</p>
            </div>
          `);
          layer.addLayer(marker);
        });
    }

    // 4. Major Events / Concerts
    if (showEvents) {
      events.forEach((e) => {
        const iconHtml = `
          <div class="flex items-center justify-center cursor-pointer">
            <div class="h-7 w-7 rounded-full bg-purple-600 border-2 border-purple-200 text-white flex items-center justify-center text-xs shadow-lg animate-bounce">
              🎟️
            </div>
          </div>
        `;
        const icon = L.divIcon({
          html: iconHtml,
          className: "custom-event-pin",
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });
        const marker = L.marker([e.latitude, e.longitude], { icon });
        marker.bindPopup(`
          <div class="p-1 font-sans text-slate-900 text-xs max-w-[250px]">
            <span class="inline-block bg-purple-100 text-purple-800 text-[10px] font-bold px-1.5 py-0.5 rounded">MAJOR CONCERT / EVENT</span>
            <h4 class="font-bold mt-1 text-purple-950">${e.name}</h4>
            <p class="text-[11px] text-slate-700 mt-1"><strong>Venue:</strong> ${e.venue}</p>
            <p class="text-[11px] text-slate-700"><strong>Attendees:</strong> ${e.expected_attendance.toLocaleString()} pax</p>
            <p class="text-[11px] text-amber-800 font-bold mt-1">Surge: ${e.taxi_surge_factor}</p>
            <p class="text-[10px] text-slate-600 mt-1">${e.commuter_impact}</p>
          </div>
        `);
        layer.addLayer(marker);
      });
    }
  }, [hotspots, busStops, weatherList, events, showHotspots, showBusStops, showWeather, showEvents]);

  // Handle active GrabMaps route rendering
  useEffect(() => {
    if (!mapInstanceRef.current || !routeLayerRef.current) return;
    const layer = routeLayerRef.current;
    layer.clearLayers();

    if (!activeRoute) return;

    // Draw route polyline
    const latLngs = activeRoute.waypoints.map((w) => [w[0], w[1]] as [number, number]);
    const polyline = L.polyline(latLngs, {
      color: "#10b981",
      weight: 6,
      opacity: 0.9,
      lineCap: "round",
      dashArray: "8, 6"
    }).addTo(layer);

    // Destination Pin
    const destIcon = L.divIcon({
      html: `
        <div class="relative flex items-center justify-center">
          <span class="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-emerald-400 opacity-75"></span>
          <div class="h-8 w-8 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-slate-950 font-black text-xs shadow-2xl">
            🏁
          </div>
        </div>
      `,
      className: "custom-dest-pin",
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
    const destMarker = L.marker(
      [activeRoute.coordinates.latitude, activeRoute.coordinates.longitude],
      { icon: destIcon }
    ).addTo(layer);

    destMarker
      .bindPopup(
        `
      <div class="p-1 font-sans text-slate-900 text-xs">
        <strong class="text-emerald-700 font-bold">${activeRoute.name}</strong>
        <p class="text-[11px] text-slate-600 mt-1">GrabMaps Route: ${activeRoute.route_summary?.distance_km} km (~${activeRoute.route_summary?.estimated_duration_minutes} mins)</p>
        <p class="text-[10px] text-amber-700 mt-0.5">${activeRoute.route_summary?.erp_toll_info}</p>
      </div>
    `
      )
      .openPopup();

    // Incidents Pins from LTA DataMall
    if (activeRoute.incidents && activeRoute.incidents.length > 0) {
      activeRoute.incidents.forEach((inc) => {
        const incIcon = L.divIcon({
          html: `
            <div class="flex items-center justify-center">
              <div class="h-6 w-6 rounded-md bg-red-600 border border-white text-white flex items-center justify-center font-bold text-[10px] shadow-lg animate-pulse">
                ⚠️
              </div>
            </div>
          `,
          className: "custom-inc-pin",
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });
        const incMarker = L.marker([inc.coordinates.latitude, inc.coordinates.longitude], {
          icon: incIcon
        }).addTo(layer);

        incMarker.bindPopup(`
          <div class="p-1 font-sans text-slate-900 text-xs">
            <span class="rounded bg-red-100 text-red-800 text-[10px] font-bold px-1.5 py-0.5">${inc.type} (${inc.expressway})</span>
            <p class="mt-1 text-[11px] text-slate-700 font-medium">${inc.message}</p>
            <p class="mt-1 text-[10px] text-amber-800 font-semibold">${inc.driver_impact}</p>
          </div>
        `);
      });
    }

    try {
      mapInstanceRef.current.fitBounds(polyline.getBounds(), {
        padding: [50, 50],
        maxZoom: 15
      });
    } catch (e) {
      console.error("fitBounds error:", e);
    }
  }, [activeRoute]);

  // Handle fly to selected hotspot
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedHotspot) return;
    mapInstanceRef.current.flyTo(
      [selectedHotspot.coordinates.latitude, selectedHotspot.coordinates.longitude],
      15,
      { duration: 1.2 }
    );
  }, [selectedHotspot]);

  // SLA OneMap Search function
  const handleSearchOneMap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setShowSearchResults(true);
    try {
      const res = await fetch(`/api/onemap?query=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results || []);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error("OneMap search error:", err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (result: OneMapSearchResult) => {
    setShowSearchResults(false);
    setSearchQuery(result.name);
    if (mapInstanceRef.current && result.coordinates) {
      mapInstanceRef.current.flyTo([result.coordinates.latitude, result.coordinates.longitude], 16, {
        duration: 1.2
      });

      // Temporary marker for search
      if (markersLayerRef.current) {
        const searchIcon = L.divIcon({
          html: `
            <div class="flex items-center justify-center">
              <div class="h-8 w-8 rounded-full bg-emerald-500 border-2 border-white text-slate-950 flex items-center justify-center font-bold text-xs shadow-2xl">
                📍
              </div>
            </div>
          `,
          className: "search-pin",
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const m = L.marker([result.coordinates.latitude, result.coordinates.longitude], {
          icon: searchIcon
        });
        m.bindPopup(`
          <div class="p-1 font-sans text-slate-900 text-xs">
            <strong class="text-emerald-700 font-bold">${result.name}</strong>
            <p class="text-[11px] text-slate-600 mt-1">${result.address}</p>
            <p class="text-[10px] text-slate-500 mt-0.5">Postal: ${result.postal}</p>
            <p class="text-[11px] text-amber-700 font-semibold mt-1">${result.taxi_access_note}</p>
          </div>
        `).openPopup();
        markersLayerRef.current.addLayer(m);
      }
    }
  };

  const quickCenter = (lat: number, lng: number, zoom: number) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], zoom, { duration: 0.8 });
    }
  };

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
      {/* SLA OneMap Canvas */}
      <div ref={mapContainerRef} className="h-full w-full z-0" />

      {/* Top Floating Controls Bar */}
      <div className="absolute top-3 left-3 right-3 sm:right-auto sm:left-4 z-20 flex flex-col gap-2 max-w-md">
        {/* SLA OneMap Search Bar */}
        <form onSubmit={handleSearchOneMap} className="relative w-full">
          <div className="flex items-center rounded-xl border border-slate-700/80 bg-slate-900/90 shadow-xl backdrop-blur-md px-3 py-1.5 focus-within:border-amber-500 transition-all">
            <Search className="h-4 w-4 text-amber-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search SLA OneMap (e.g. 'Orchard', 'MBS', '238801')..."
              className="w-full bg-transparent px-2 text-xs text-white placeholder-slate-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setShowSearchResults(false);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              type="submit"
              disabled={isSearching}
              className="ml-1 rounded-lg bg-amber-500 px-2.5 py-1 text-[11px] font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50"
            >
              {isSearching ? "..." : "Locate"}
            </button>
          </div>

          {/* Search Results Dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 max-h-60 overflow-y-auto rounded-xl border border-slate-700 bg-slate-900/95 p-1 shadow-2xl backdrop-blur-md z-30">
              {searchResults.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectSearchResult(r)}
                  className="w-full text-left rounded-lg p-2 text-xs hover:bg-slate-800 transition-colors"
                >
                  <div className="font-semibold text-amber-400">{r.name}</div>
                  <div className="text-[11px] text-slate-300 truncate">{r.address}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Postal: {r.postal}</div>
                </button>
              ))}
            </div>
          )}
        </form>

        {/* Quick Region Center Jump Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => quickCenter(1.3521, 103.8198, 12)}
            className="rounded-lg border border-slate-700/60 bg-slate-900/80 px-2 py-1 text-[11px] font-semibold text-slate-300 hover:bg-slate-800 backdrop-blur-sm"
          >
            🇸🇬 All SG
          </button>
          <button
            onClick={() => quickCenter(1.303, 103.834, 15)}
            className="rounded-lg border border-slate-700/60 bg-slate-900/80 px-2 py-1 text-[11px] font-semibold text-amber-400 hover:bg-slate-800 backdrop-blur-sm"
          >
            Orchard / CBD
          </button>
          <button
            onClick={() => quickCenter(1.333, 103.742, 14)}
            className="rounded-lg border border-slate-700/60 bg-slate-900/80 px-2 py-1 text-[11px] font-semibold text-blue-400 hover:bg-slate-800 backdrop-blur-sm"
          >
            Jurong East
          </button>
          <button
            onClick={() => quickCenter(1.355, 103.987, 14)}
            className="rounded-lg border border-slate-700/60 bg-slate-900/80 px-2 py-1 text-[11px] font-semibold text-purple-400 hover:bg-slate-800 backdrop-blur-sm"
          >
            Changi Airport
          </button>
          <button
            onClick={() => quickCenter(1.437, 103.786, 14)}
            className="rounded-lg border border-slate-700/60 bg-slate-900/80 px-2 py-1 text-[11px] font-semibold text-emerald-400 hover:bg-slate-800 backdrop-blur-sm"
          >
            Woodlands
          </button>
        </div>
      </div>

      {/* Layer Controls & Map Style Switcher (Floating Right) */}
      <div className="absolute top-16 right-3 z-20 flex flex-col items-end gap-2">
        {/* SLA OneMap Style Picker */}
        <div className="flex items-center rounded-xl border border-slate-700/80 bg-slate-900/90 p-1 shadow-xl backdrop-blur-md">
          <button
            onClick={() => setMapStyle("Night")}
            className={`rounded-lg px-2 py-1 text-[10px] font-bold transition-all ${
              mapStyle === "Night" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-white"
            }`}
          >
            🌙 Night
          </button>
          <button
            onClick={() => setMapStyle("Default")}
            className={`rounded-lg px-2 py-1 text-[10px] font-bold transition-all ${
              mapStyle === "Default" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-white"
            }`}
          >
            ☀️ Day
          </button>
          <button
            onClick={() => setMapStyle("Grey")}
            className={`rounded-lg px-2 py-1 text-[10px] font-bold transition-all ${
              mapStyle === "Grey" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-white"
            }`}
          >
            🪨 Grey
          </button>
        </div>

        {/* Feature Toggles */}
        <div className="flex flex-col gap-1 rounded-xl border border-slate-700/80 bg-slate-900/90 p-1.5 shadow-xl backdrop-blur-md text-[10px]">
          <button
            onClick={() => setShowHotspots(!showHotspots)}
            className={`flex items-center justify-between gap-2 rounded-lg px-2 py-1 transition-colors ${
              showHotspots ? "bg-amber-500/20 text-amber-300 font-bold" : "text-slate-500"
            }`}
          >
            <span>🔥 Taxi Hotspots</span>
            <span>{showHotspots ? "ON" : "OFF"}</span>
          </button>
          <button
            onClick={() => setShowBusStops(!showBusStops)}
            className={`flex items-center justify-between gap-2 rounded-lg px-2 py-1 transition-colors ${
              showBusStops ? "bg-blue-500/20 text-blue-300 font-bold" : "text-slate-500"
            }`}
          >
            <span>🚏 Crowded Bus (Crit 2)</span>
            <span>{showBusStops ? "ON" : "OFF"}</span>
          </button>
          <button
            onClick={() => setShowWeather(!showWeather)}
            className={`flex items-center justify-between gap-2 rounded-lg px-2 py-1 transition-colors ${
              showWeather ? "bg-sky-500/20 text-sky-300 font-bold" : "text-slate-500"
            }`}
          >
            <span>🌧️ Rain/Cloudy (Crit 1)</span>
            <span>{showWeather ? "ON" : "OFF"}</span>
          </button>
          <button
            onClick={() => setShowEvents(!showEvents)}
            className={`flex items-center justify-between gap-2 rounded-lg px-2 py-1 transition-colors ${
              showEvents ? "bg-purple-500/20 text-purple-300 font-bold" : "text-slate-500"
            }`}
          >
            <span>🎟️ Concerts/Events</span>
            <span>{showEvents ? "ON" : "OFF"}</span>
          </button>
        </div>
      </div>

      {/* Active GrabMaps Route Banner */}
      {activeRoute && (
        <div className="absolute top-28 left-3 right-3 sm:left-4 sm:right-auto sm:w-96 z-30 rounded-2xl border border-emerald-500/50 bg-slate-900/95 p-3.5 shadow-2xl backdrop-blur-lg">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-emerald-400">
                <span>GRABMAPS ACTIVE NAVIGATION</span>
                <span className="rounded bg-emerald-500/20 px-1 py-0.2 text-[9px]">SLA ONEMAP</span>
              </div>
              <h4 className="font-bold text-white text-xs mt-0.5">{activeRoute.name}</h4>
            </div>
            {onClearRoute && (
              <button
                type="button"
                onClick={onClearRoute}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] font-mono">
            <div className="rounded bg-slate-950/80 p-1.5 border border-slate-800">
              <span className="text-slate-400 block">Distance:</span>
              <span className="text-white font-bold">{activeRoute.route_summary?.distance_km} km</span>
            </div>
            <div className="rounded bg-slate-950/80 p-1.5 border border-slate-800">
              <span className="text-slate-400 block">Duration & ETA:</span>
              <span className="text-amber-400 font-bold">~{activeRoute.route_summary?.estimated_duration_minutes} mins ({activeRoute.route_summary?.eta_timestamp})</span>
            </div>
          </div>
          <p className="mt-1.5 text-[10px] text-slate-300">
            {activeRoute.route_summary?.erp_toll_info}
          </p>
        </div>
      )}

      {/* Selected Hotspot Bottom Sheet Modal / Card */}
      {selectedHotspot && (
        <div className="absolute bottom-3 left-3 right-3 sm:left-4 sm:right-auto sm:w-96 z-30 rounded-2xl border border-amber-500/40 bg-slate-900/95 p-4 shadow-2xl backdrop-blur-lg">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="rounded-md bg-amber-500 px-2 py-0.5 font-mono text-[10px] font-black text-slate-950">
                  SCORE {selectedHotspot.demand_score}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  {selectedHotspot.demand_tier}
                </span>
              </div>
              <h3 className="mt-1 font-bold text-white text-base leading-tight">
                {selectedHotspot.name}
              </h3>
              <p className="text-xs text-slate-400">{selectedHotspot.location_title}</p>
            </div>
            <button
              onClick={() => onSelectHotspot(null)}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Reasoning Grid */}
          <div className="mt-3 space-y-2 text-xs">
            {/* Criteria 1: Weather */}
            <div className="rounded-xl border border-sky-500/30 bg-sky-950/30 p-2.5">
              <div className="flex items-center gap-1.5 font-bold text-sky-400 text-[11px]">
                <CloudRain className="h-3.5 w-3.5" />
                <span>Criteria 1: Weather Factor</span>
              </div>
              <p className="mt-1 text-slate-300 text-[11px] leading-relaxed">
                {selectedHotspot.weather_factor} ({selectedHotspot.weather_status})
              </p>
            </div>

            {/* Criteria 2: Bus Stop Crowding */}
            <div className="rounded-xl border border-amber-500/30 bg-amber-950/30 p-2.5">
              <div className="flex items-center gap-1.5 font-bold text-amber-400 text-[11px]">
                <Users className="h-3.5 w-3.5" />
                <span>Criteria 2: Bus Stop Congestion</span>
              </div>
              <p className="mt-1 text-slate-300 text-[11px] leading-relaxed">
                {selectedHotspot.bus_crowd_factor}. Commuter switch-to-taxi rate:{" "}
                <strong className="text-amber-300">{selectedHotspot.taxi_conversion_rate}</strong>.
              </p>
            </div>

            {/* Pickup Advice & Wait Time */}
            <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-2.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Recommended Bay:</span>
                <span className="font-bold text-emerald-400">{selectedHotspot.recommended_pickup_bay}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Est. Passenger Pickup Wait:</span>
                <span className="font-bold text-amber-300">{selectedHotspot.estimated_pickup_wait_mins}</span>
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => {
                if (mapInstanceRef.current) {
                  mapInstanceRef.current.flyTo(
                    [selectedHotspot.coordinates.latitude, selectedHotspot.coordinates.longitude],
                    16,
                    { duration: 1 }
                  );
                }
              }}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 py-2 text-xs font-bold text-slate-950 shadow-md hover:bg-amber-400 transition-colors"
            >
              <Navigation className="h-3.5 w-3.5" />
              <span>Center & Zoom Here</span>
            </button>
          </div>
        </div>
      )}

      {/* SLA OneMap Attribution Watermark */}
      <div className="absolute bottom-1 right-2 z-10 rounded bg-slate-950/80 px-2 py-0.5 text-[9px] font-mono text-slate-400 pointer-events-none">
        Map data © Singapore Land Authority (SLA) OneMap
      </div>
    </div>
  );
};
