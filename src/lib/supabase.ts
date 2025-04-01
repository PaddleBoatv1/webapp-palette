
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

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
