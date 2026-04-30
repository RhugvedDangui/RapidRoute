import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://sujbxntyrfqgvxgxbbyk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1amJ4bnR5cmZxZ3Z4Z3hiYnlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NTA3MTQsImV4cCI6MjA5MzAyNjcxNH0.pKzOxffd4AEpzcIXQnVf_FFUO9XLBJC3haUVAhcB-PE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database types
export interface Driver {
  id: string;
  seller_id: string;
  name: string;
  phone: string;
  email?: string;
  vehicle_id?: string;
  status: 'available' | 'on_delivery' | 'offline';
  current_lat?: number;
  current_lng?: number;
  created_at: string;
}

export interface Order {
  id: string;
  customer: string;
  address: string;
  lat: number;
  lng: number;
  total: number;
  status: 'pending' | 'dispatched' | 'out_for_delivery' | 'in_progress' | 'delivered' | 'failed';
  time_window: 'morning' | 'afternoon' | 'evening';
  created_at: string;
  batch_id?: string;
  weight_kg: number;
  payment_type: 'prepaid' | 'cod';
  is_return: boolean;
  proof_of_delivery?: string;
}

export interface Batch {
  id: string;
  created_at: string;
  total_orders: number;
  estimated_distance: number;
  estimated_time: number;
  estimated_cost: number;
  vehicle_id?: string;
  carbon_saved: number;
  status: 'pending' | 'dispatched' | 'out_for_delivery' | 'in_progress' | 'completed';
  driver_id?: string;
}

export interface Route {
  id: string;
  batch_id: string;
  order_sequence: string[]; // Array of order IDs
  total_distance: number;
  total_time: number;
  polyline: Array<{ lat: number; lng: number }>;
}

export interface DelayPrediction {
  id: string;
  order_id: string;
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high';
  explanation: string;
  suggested_action: string;
  precipitation_mm?: number;
  wind_speed_kmh?: number;
  weather_code?: number;
  weather_description?: string;
  temperature_celsius?: number;
  distance_km?: number;
  courier_reliability_score?: number;
  time_of_day?: number;
  created_at: string;
}
