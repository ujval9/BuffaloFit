// types/index.ts
// Shared TypeScript interfaces — mirrors the Python schemas

export interface User {
  id: number;
  email?: string;
  name: string;
  onboarding_done: boolean;
}

export type Fabric = 'cotton' | 'wool' | 'synthetic';
export type Category = 'base_layer' | 'top' | 'bottom' | 'outer';
export type Location = 'closet' | 'washer' | 'dryer';
export type DryerSetting = 'high' | 'medium' | 'low';

export interface ClothingItem {
  id: number;
  user_id: number;
  name: string;
  category: Category;
  fabric: Fabric;
  warmth_score: number;
  color: string;
  is_clean: boolean;
  is_wet: boolean;
  location: Location;
  dryer_setting: DryerSetting;
  drying_started_at: string | null;
}

export interface ClothingItemCreate {
  name: string;
  category: Category;
  fabric: Fabric;
  warmth_score: number;
  color: string;
  is_clean: boolean;
  is_wet: boolean;
  location: Location;
  dryer_setting: DryerSetting;
}

export interface ClassSchedule {
  id: number;
  user_id: number;
  course_name: string;
  start_time: string; // ISO datetime
  end_time: string;
  travel_minutes: number;
  days_of_week: string;
}

export interface ClassScheduleCreate {
  course_name: string;
  start_time: string;
  end_time: string;
  travel_minutes: number;
  days_of_week: string;
}

export interface ItemReadiness {
  item_id: number;
  item_name: string;
  is_ready: boolean;
  location: Location;
  minutes_to_dry?: number;
  minutes_remaining?: number;
  dry_at?: string;
  leave_at?: string;
}

export interface RecommendationResponse {
  outfit_ready: boolean;
  status_color: 'green' | 'red';
  status_message: string;
  items: ItemReadiness[];
  weather: WeatherData;
  layering: LayeringData;
  alternatives: ClothingItem[];
  leave_at?: string;
}

export interface WeatherData {
  temperature_f: number;
  temperature_c: number;
  precipitation_probability: number;
  condition: string;
  forecast_time: string;
  error?: string;
}

export interface LayeringData {
  base?: string;
  mid?: string;
  outer?: string;
  note?: string;
  warmth_score_needed: number;
}

export interface AppConstants {
  fabric_types: string[];
  dryer_settings: string[];
  categories: string[];
  fabric_colors: Record<string, string>;
}

// Fabric dot color map — matches backend schemas.py
export const FABRIC_COLORS: Record<Fabric, string> = {
  cotton: '#4B9CD3',    // blue
  wool: '#D4A017',      // amber
  synthetic: '#9B59B6', // purple
};

export const CATEGORY_LABELS: Record<Category, string> = {
  base_layer: 'Base Layer',
  top: 'Top',
  bottom: 'Bottom',
  outer: 'Outer',
};

export const DRYER_SETTING_LABELS: Record<DryerSetting, string> = {
  high: 'High Heat',
  medium: 'Medium Heat',
  low: 'Low Heat',
};
