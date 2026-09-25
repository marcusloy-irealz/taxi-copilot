export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface WeatherForecastItem {
  area: string;
  forecast: string;
  is_rain: boolean;
  is_cloudy: boolean;
  taxi_impact: "VERY_HIGH" | "HIGH" | "NORMAL";
  demand_multiplier: number;
  driver_advice: string;
  coordinates: Coordinates;
}

export interface BusStopItem {
  stop_id: string;
  stop_name: string;
  road_name: string;
  region: string;
  coordinates: Coordinates;
  commuter_queue_count: number;
  crowd_level: "severe" | "high" | "moderate";
  switch_to_taxi_probability: string;
  taxi_reason: string;
  mrt_interchange: string;
  recommended_taxi_stand: string;
  congested_bus_services: string[];
}

export interface HotspotItem {
  id: string;
  name: string;
  location_title: string;
  region: string;
  demand_score: number;
  demand_tier: "SURGE_PEAK" | "HIGH" | "ELEVATED" | "MODERATE";
  coordinates: Coordinates;
  weather_status: string;
  weather_factor: string;
  bus_crowd_factor: string;
  event_factor: string;
  taxi_conversion_rate: string;
  recommended_pickup_bay: string;
  estimated_pickup_wait_mins: string;
  reasoning_synthesis: string;
}

export interface MajorEventItem {
  id: string;
  name: string;
  venue: string;
  address: string;
  latitude: number;
  longitude: number;
  category: string;
  expected_attendance: number;
  status: string;
  time_window: string;
  taxi_surge_factor: string;
  recommended_pickup_bays: string[];
  commuter_impact: string;
}

export interface OneMapSearchResult {
  name: string;
  address: string;
  road: string;
  postal: string;
  block: string;
  coordinates: Coordinates;
  taxi_access_note: string;
}

export interface TaxiReasoningResult {
  source: string;
  fetched_at: string;
  question: string;
  driver_location: string;
  tactical_summary: string;
  criteria_1_weather_analysis: string;
  criteria_2_bus_crowd_analysis: string;
  primary_target: HotspotItem;
  alternative_hotspots: HotspotItem[];
  active_events: MajorEventItem[];
  driver_tactical_tips: string[];
}
