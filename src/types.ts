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

export interface McpServerExecutionLog {
  server: string;
  tool: string;
  request: any;
  response: any;
  latency_ms: number;
}

export interface McpQuestionAnswerResponse {
  question: string;
  driver_location: string;
  synthesized_answer: string;
  total_execution_time_ms: number;
  mcp_servers_used: Array<{
    name: string;
    tools_called: string[];
    status: string;
  }>;
  reasoning_breakdown: {
    weather_mcp_analysis: string;
    lta_datamall_mcp_analysis: string;
    grabmaps_mcp_routing: string;
  };
  primary_target_pickup: {
    name: string;
    address: string;
    coordinates: Coordinates;
    station_code: string;
    station_name: string;
    commuters_waiting: number;
    taxi_switch_probability: string;
    route_summary: {
      distance_km: number;
      estimated_duration_minutes: number;
      eta_timestamp: string;
      erp_toll_info: string;
      recommended_lane: string;
    };
    navigation_waypoints: number[][];
  };
  traffic_incidents_alert: Array<{
    id: string;
    type: string;
    expressway: string;
    location: string;
    message: string;
    coordinates: Coordinates;
    driver_impact: string;
  }>;
  mcp_call_logs: McpServerExecutionLog[];
}
