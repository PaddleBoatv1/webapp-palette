import { createClient } from '@supabase/supabase-js';

// This file is deprecated. Please use '@/integrations/supabase/client' instead.
// Keeping this file to avoid breaking existing imports, but it redirects to the main client.

// Import the main client to re-export
import { supabase as mainClient } from '@/integrations/supabase/client';

// Re-export the main client
export const supabase = mainClient;

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return true; // We're using hardcoded credentials, so it's always configured
};

// Re-export the types
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

// Add the update_delivery_job_assignment RPC function to allow manual job assignment
export const updateDeliveryJobAssignment = async (jobId: string, liaisonId: string) => {
  const { data, error } = await supabase.rpc('update_delivery_job_assignment', {
    job_id: jobId,
    liaison_id: liaisonId
  });
  
  if (error) {
    console.error('Error updating job assignment:', error);
    throw error;
  }
  
  return data;
};
