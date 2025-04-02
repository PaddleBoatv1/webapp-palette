
import { createClient } from '@supabase/supabase-js';

// Use direct credentials for this project
const supabaseUrl = 'https://vstqtcvwnvkcdrxteubg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzdHF0Y3Z3bnZrY2RyeHRldWJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MTk0NDcsImV4cCI6MjA1OTA5NTQ0N30.NdXDXoEyNmW309tSXCTiFu_MPmpP1TrD0FKPgf-nK2w';

// Create the Supabase client with improved options
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  },
  global: {
    fetch: (url, options) => {
      console.log('Supabase fetch request:', url);
      return fetch(url, options);
    }
  }
});

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return true; // We're now using hardcoded credentials, so it's always configured
};

// Types for database tables
export type User = {
  id: string;
  email: string;
  full_name?: string;
  phone_number?: string;
  role: 'customer' | 'admin' | 'liaison';
  created_at?: string;
};

export type Boat = {
  id: string;
  boat_name: string;
  status: 'available' | 'reserved' | 'in_use' | 'maintenance';
  gps_device_id?: string;
};

export type Zone = {
  id: string;
  zone_name: string;
  is_premium: boolean;
  description?: string;
  coordinates?: any;
};

export type Reservation = {
  id: string;
  user_id: string;
  boat_id?: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'canceled';
  start_time?: string;
  end_time?: string;
  start_zone_id?: string;
  end_zone_id?: string;
  distance_traveled?: number;
  total_minutes?: number;
  estimated_cost?: number;
  final_cost?: number;
};

export type Payment = {
  id: string;
  reservation_id: string;
  payment_amount: number;
  currency: string;
  payment_method?: string;
  payment_status: 'pending' | 'succeeded' | 'failed';
  transaction_id?: string;
};

export type Waiver = {
  id: string;
  version_label: string;
  waiver_text: string;
  created_at?: string;
};

export type WaiverAcceptance = {
  id: string;
  user_id: string;
  waiver_id: string;
  accepted_at: string;
  signature_file_url?: string;
};

export type CompanyLiaison = {
  id: string;
  user_id: string;
  is_active: boolean;
  current_location?: {
    lat: number;
    lng: number;
  };
};

export type BoatDelivery = {
  id: string;
  reservation_id: string;
  liaison_id?: string;
  delivery_status: 'assigned' | 'in_transit' | 'delivered' | 'completed';
  estimated_arrival?: string;
  actual_arrival?: string;
  pickup_time?: string;
};

export type BoatLocation = {
  id: string;
  boat_id: string;
  captured_at: string;
  lat: number;
  lng: number;
};

export type Notification = {
  id: string;
  user_id: string;
  notification_type: string;
  channel: 'email' | 'sms' | 'push';
  message_content: string;
  sent_at?: string;
};
