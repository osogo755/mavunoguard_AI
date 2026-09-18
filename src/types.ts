export type Language = 'en' | 'sw' | 'ek';

export interface Farm {
  id: string;
  user_id?: string;
  name: string;
  latitude: number;
  longitude: number;
  size: number;
  unit: 'acres' | 'hectares';
  crop: string;
  variety?: string;
  planting_date?: string;
  expected_harvest_date?: string;
  soil_type?: string;
  drainage?: string;
  flood_history?: string;
  slope?: string;
  crop_health?: 'poor' | 'fair' | 'good' | 'excellent';
  current_problems?: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface WeatherDaily {
  date: string;
  temp_max: number;
  temp_min: number;
  precipitation: number;
  precipitation_probability: number;
  weather_code: number;
}

export interface WeatherData {
  latitude: number;
  longitude: number;
  current_temp: number;
  current_weather_code: number;
  current_condition: string;
  soil_moisture: number | null;
  daily: WeatherDaily[];
  rainfall_7d: number;
  rainfall_14d: number;
  provider: string;
  source_status: 'Live' | 'Cached' | 'Unavailable';
  last_updated: string;
}

export interface SatelliteNDVI {
  configured: boolean;
  status_message: string;
  latest_ndvi: number | null;
  ndvi_trend: string | null;
  observation_date: string | null;
  cloud_cover: number | null;
  vigor_interpretation: string | null;
  source: string;
  status: 'Live' | 'Cached' | 'Not Configured' | 'Temporarily Unavailable';
  history?: Array<{ date: string; ndvi: number }>;
}

export interface AnalysisReport {
  id: string;
  farm_id: string;
  farm_name: string;
  user_id?: string;
  created_at: string;
  overall_score: number;
  risk_level: 'LOW' | 'MODERATE' | 'MODERATE-HIGH' | 'HIGH';
  drought_risk: number;
  flood_risk: number;
  crop_stress: number;
  ndvi: number | null;
  ndvi_trend: string | null;
  reasons: string[];
  recommended_actions: string[];
  watch_next: string[];
  ai_headline?: string;
  ai_explanation?: string;
  ai_provider: string;
  weather_source: string;
  satellite_source: string;
  weather_summary?: {
    temp?: number;
    condition?: string;
    rainfall_7d?: number;
    rainfall_14d?: number;
    soil_moisture?: number | null;
  };
}

export interface SystemConfig {
  supabase_url: string;
  supabase_configured: boolean;
  google_client_id: string;
  gemini_configured: boolean;
  openai_configured: boolean;
  sentinel_configured: boolean;
  app_name: string;
  version: string;
}

export interface SyncQueueItem {
  id: string;
  entity_type: 'farm' | 'observation' | 'analysis';
  entity_id?: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: any;
  created_at: string;
}
