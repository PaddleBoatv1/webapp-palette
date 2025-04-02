-- Schema for Paddle Boat Rental System

-- Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone_number TEXT,
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'liaison')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Waivers Table
CREATE TABLE IF NOT EXISTS public.waivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_label TEXT NOT NULL,
  waiver_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Waiver Acceptances Table
CREATE TABLE IF NOT EXISTS public.waiver_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  waiver_id UUID REFERENCES public.waivers(id) ON DELETE CASCADE,
  accepted_at TIMESTAMPTZ DEFAULT now(),
  signature_file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Boats Table
CREATE TABLE IF NOT EXISTS public.boats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boat_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'in_use', 'maintenance')),
  gps_device_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Zones Table
CREATE TABLE IF NOT EXISTS public.zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_name TEXT NOT NULL,
  is_premium BOOLEAN DEFAULT false,
  description TEXT,
  coordinates JSONB, -- Store GeoJSON for zone boundaries
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Reservations Table
CREATE TABLE IF NOT EXISTS public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  boat_id UUID REFERENCES public.boats(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'awaiting_pickup', 'completed', 'canceled')),
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  start_zone_id UUID REFERENCES public.zones(id),
  end_zone_id UUID REFERENCES public.zones(id),
  distance_traveled NUMERIC,
  total_minutes INTEGER,
  estimated_cost NUMERIC(10,2),
  final_cost NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Company Liaisons Table
CREATE TABLE IF NOT EXISTS public.company_liaisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  current_location JSONB, -- Store current lat/lng as JSON
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Boat Deliveries Table
CREATE TABLE IF NOT EXISTS public.boat_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID REFERENCES public.reservations(id) ON DELETE CASCADE,
  liaison_id UUID REFERENCES public.company_liaisons(id) ON DELETE SET NULL,
  delivery_status TEXT DEFAULT 'assigned' CHECK (delivery_status IN ('assigned', 'in_transit', 'delivered', 'completed')),
  estimated_arrival TIMESTAMPTZ,
  actual_arrival TIMESTAMPTZ,
  pickup_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Delivery Jobs Table (explicitly defined)
CREATE TABLE IF NOT EXISTS public.delivery_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID REFERENCES public.reservations(id) ON DELETE CASCADE,
  liaison_id UUID REFERENCES public.company_liaisons(id) ON DELETE SET NULL,
  job_type TEXT NOT NULL CHECK (job_type IN ('delivery', 'pickup')),
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'assigned', 'in_progress', 'completed', 'cancelled')),
  assigned_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Payments Table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID REFERENCES public.reservations(id) ON DELETE CASCADE,
  payment_amount NUMERIC(10,2),
  currency TEXT DEFAULT 'CAD',
  payment_method TEXT, -- e.g., "card", "paypal", "stripe_token"
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'succeeded', 'failed')),
  transaction_id TEXT, -- Gateway reference (Stripe charge ID, etc.)
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Boat Locations Table (for historical tracking)
CREATE TABLE IF NOT EXISTS public.boat_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boat_id UUID REFERENCES public.boats(id) ON DELETE CASCADE,
  captured_at TIMESTAMPTZ DEFAULT now(),
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL, -- e.g., "booking_confirmed", "boat_arriving", "payment_receipt"
  channel TEXT NOT NULL, -- e.g., "email", "sms", "push"
  message_content TEXT NOT NULL,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create Row Level Security Policies

-- First drop existing policies to avoid errors
DO $$ 
BEGIN
  -- Drop users policies
  BEGIN
    DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
  EXCEPTION
    WHEN OTHERS THEN NULL;
  END;
  
  BEGIN
    DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
  EXCEPTION
    WHEN OTHERS THEN NULL;
  END;
  
  BEGIN
    DROP POLICY IF EXISTS "Allow public signup" ON public.users;
  EXCEPTION
    WHEN OTHERS THEN NULL;
  END;
  
  BEGIN
    DROP POLICY IF EXISTS "Admins have full access to users" ON public.users;
  EXCEPTION
    WHEN OTHERS THEN NULL;
  END;
  
  -- Drop reservations policies
  BEGIN
    DROP POLICY IF EXISTS "Users can view their own reservations" ON public.reservations;
  EXCEPTION
    WHEN OTHERS THEN NULL;
  END;
  
  BEGIN
    DROP POLICY IF EXISTS "Users can create their own reservations" ON public.reservations;
  EXCEPTION
    WHEN OTHERS THEN NULL;
  END;
  
  BEGIN
    DROP POLICY IF EXISTS "Users can update their own reservations" ON public.reservations;
  EXCEPTION
    WHEN OTHERS THEN NULL;
  END;
  
  BEGIN
    DROP POLICY IF EXISTS "Admins have full access to reservations" ON public.reservations;
  EXCEPTION
    WHEN OTHERS THEN NULL;
  END;
  
  -- Drop payments policies
  BEGIN
    DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
  EXCEPTION
    WHEN OTHERS THEN NULL;
  END;
  
  BEGIN
    DROP POLICY IF EXISTS "Admins have full access to payments" ON public.payments;
  EXCEPTION
    WHEN OTHERS THEN NULL;
  END;
  
  -- Drop waiver acceptances policies
  BEGIN
    DROP POLICY IF EXISTS "Users can view their own waiver acceptances" ON public.waiver_acceptances;
  EXCEPTION
    WHEN OTHERS THEN NULL;
  END;
  
  BEGIN
    DROP POLICY IF EXISTS "Users can create their own waiver acceptances" ON public.waiver_acceptances;
  EXCEPTION
    WHEN OTHERS THEN NULL;
  END;
  
  -- Drop waivers policies
  BEGIN
    DROP POLICY IF EXISTS "Anyone can view waivers" ON public.waivers;
  EXCEPTION
    WHEN OTHERS THEN NULL;
  END;
  
  -- Drop zones policies
  BEGIN
    DROP POLICY IF EXISTS "Anyone can view zones" ON public.zones;
  EXCEPTION
    WHEN OTHERS THEN NULL;
  END;
  
  -- Drop boats policies
  BEGIN
    DROP POLICY IF EXISTS "Anyone can view boats" ON public.boats;
  EXCEPTION
    WHEN OTHERS THEN NULL;
  END;
  
  BEGIN
    DROP POLICY IF EXISTS "Admins have full access to boats" ON public.boats;
  EXCEPTION
    WHEN OTHERS THEN NULL;
  END;
  
  BEGIN
    DROP POLICY IF EXISTS "Admins have full access to zones" ON public.zones;
  EXCEPTION
    WHEN OTHERS THEN NULL;
  END;
  
  BEGIN
    DROP POLICY IF EXISTS "Admins have full access to boat_deliveries" ON public.boat_deliveries;
  EXCEPTION
    WHEN OTHERS THEN NULL;
  END;
  
  BEGIN
    DROP POLICY IF EXISTS "Admins have full access to company_liaisons" ON public.company_liaisons;
  EXCEPTION
    WHEN OTHERS THEN NULL;
  END;
  
  BEGIN
    DROP POLICY IF EXISTS "Liaisons can view reservations" ON public.reservations;
  EXCEPTION
    WHEN OTHERS THEN NULL;
  END;
  
  BEGIN
    DROP POLICY IF EXISTS "Liaisons can update specific reservations" ON public.reservations;
  EXCEPTION
    WHEN OTHERS THEN NULL;
  END;
  
  BEGIN
    DROP POLICY IF EXISTS "Liaisons can view and update boat_deliveries" ON public.boat_deliveries;
  EXCEPTION
    WHEN OTHERS THEN NULL;
  END;
END $$;

-- Users Table Policies
CREATE POLICY "Users can view their own profile" 
ON public.users FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.users FOR UPDATE 
USING (auth.uid() = id);

-- First allow public signup
CREATE POLICY "Allow public signup"
ON public.users FOR INSERT
WITH CHECK (true);

-- Admins have full access to users
CREATE POLICY "Admins have full access to users" 
ON public.users 
USING (
  auth.jwt() ->> 'role' = 'admin'
);

-- Reservations Table Policies
CREATE POLICY "Users can view their own reservations" 
ON public.reservations FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reservations" 
ON public.reservations FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reservations" 
ON public.reservations FOR UPDATE 
USING (auth.uid() = user_id AND status NOT IN ('completed', 'canceled'));

-- Payments Table Policies
CREATE POLICY "Users can view their own payments" 
ON public.payments FOR SELECT 
USING (auth.uid() IN (
  SELECT user_id FROM public.reservations WHERE id = reservation_id
));

-- Waiver Acceptances Policies
CREATE POLICY "Users can view their own waiver acceptances"
ON public.waiver_acceptances FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own waiver acceptances"
ON public.waiver_acceptances FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Waivers are public
CREATE POLICY "Anyone can view waivers"
ON public.waivers FOR SELECT
USING (true);

-- Zones are public
CREATE POLICY "Anyone can view zones"
ON public.zones FOR SELECT
USING (true);

-- Boats are public for viewing
CREATE POLICY "Anyone can view boats"
ON public.boats FOR SELECT
USING (true);

-- Admin policies for other tables
CREATE POLICY "Admins have full access to reservations" 
ON public.reservations 
USING (
  auth.jwt() ->> 'role' = 'admin'
);

CREATE POLICY "Admins have full access to boats" 
ON public.boats 
USING (
  auth.jwt() ->> 'role' = 'admin'
);

CREATE POLICY "Admins have full access to zones" 
ON public.zones 
USING (
  auth.jwt() ->> 'role' = 'admin'
);

CREATE POLICY "Admins have full access to payments" 
ON public.payments 
USING (
  auth.jwt() ->> 'role' = 'admin'
);

CREATE POLICY "Admins have full access to boat_deliveries" 
ON public.boat_deliveries 
USING (
  auth.jwt() ->> 'role' = 'admin'
);

CREATE POLICY "Admins have full access to company_liaisons" 
ON public.company_liaisons 
USING (
  auth.jwt() ->> 'role' = 'admin'
);

-- Liaison role permissions
CREATE POLICY "Liaisons can view reservations" 
ON public.reservations 
USING (
  auth.jwt() ->> 'role' = 'liaison'
);

CREATE POLICY "Liaisons can update specific reservations" 
ON public.reservations FOR UPDATE
USING (
  auth.jwt() ->> 'role' = 'liaison'
  AND status IN ('confirmed', 'in_progress')
);

CREATE POLICY "Liaisons can view and update boat_deliveries" 
ON public.boat_deliveries 
USING (
  auth.jwt() ->> 'role' = 'liaison'
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON public.reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_reservation_id ON public.payments(reservation_id);
CREATE INDEX IF NOT EXISTS idx_boat_locations_boat_id ON public.boat_locations(boat_id);
CREATE INDEX IF NOT EXISTS idx_company_liaisons_user_id ON public.company_liaisons(user_id);
CREATE INDEX IF NOT EXISTS idx_boat_deliveries_reservation_id ON public.boat_deliveries(reservation_id);
CREATE INDEX IF NOT EXISTS idx_boat_deliveries_liaison_id ON public.boat_deliveries(liaison_id);
CREATE INDEX IF NOT EXISTS idx_waiver_acceptances_user_id ON public.waiver_acceptances(user_id);

-- Function to update boat status when a reservation is completed
CREATE OR REPLACE FUNCTION public.update_boat_status_on_reservation_complete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE boats SET status = 'available' WHERE id = NEW.boat_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create delivery jobs when reservation status changes
CREATE OR REPLACE FUNCTION public.create_delivery_job_on_reservation_confirm()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'confirmed' AND OLD.status = 'pending' THEN
    -- Create a delivery job when a reservation is confirmed
    INSERT INTO delivery_jobs (reservation_id, job_type, status)
    VALUES (NEW.id, 'delivery', 'available');
  ELSIF NEW.status = 'awaiting_pickup' AND OLD.status = 'in_progress' THEN
    -- Check if a pickup job already exists for this reservation
    IF NOT EXISTS (SELECT 1 FROM delivery_jobs WHERE reservation_id = NEW.id AND job_type = 'pickup') THEN
      -- Create a pickup job when a reservation is marked as awaiting pickup
      INSERT INTO delivery_jobs (reservation_id, job_type, status)
      VALUES (NEW.id, 'pickup', 'available');
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update liaison job count when job status changes
CREATE OR REPLACE FUNCTION public.update_liaison_job_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- If job was assigned to a liaison
    IF NEW.liaison_id IS NOT NULL AND (OLD.liaison_id IS NULL OR OLD.liaison_id != NEW.liaison_id) THEN
      -- Check if the liaison already has a job for this reservation
      IF NOT EXISTS (
        SELECT 1 FROM delivery_jobs 
        WHERE reservation_id = NEW.reservation_id 
        AND liaison_id = NEW.liaison_id 
        AND id != NEW.id
      ) THEN
        -- Only increment if this is the first job for this reservation
        UPDATE company_liaisons 
        SET current_job_count = current_job_count + 1
        WHERE id = NEW.liaison_id;
      END IF;
    END IF;
    
    -- If job was completed or cancelled and had a liaison assigned
    IF NEW.status IN ('completed', 'cancelled') AND OLD.status NOT IN ('completed', 'cancelled') 
       AND OLD.liaison_id IS NOT NULL THEN
      -- Only decrement if this is the last job for this reservation
      IF NOT EXISTS (
        SELECT 1 FROM delivery_jobs 
        WHERE reservation_id = OLD.reservation_id 
        AND liaison_id = OLD.liaison_id 
        AND id != OLD.id 
        AND status NOT IN ('completed', 'cancelled')
      ) THEN
        UPDATE company_liaisons 
        SET current_job_count = GREATEST(0, current_job_count - 1)
        WHERE id = OLD.liaison_id;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers
DROP TRIGGER IF EXISTS boat_status_update_trigger ON public.reservations;
CREATE TRIGGER boat_status_update_trigger
  AFTER UPDATE ON public.reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_boat_status_on_reservation_complete();

DROP TRIGGER IF EXISTS create_delivery_job_trigger ON public.reservations;
CREATE TRIGGER create_delivery_job_trigger
  AFTER UPDATE ON public.reservations
  FOR EACH ROW
  EXECUTE FUNCTION create_delivery_job_on_reservation_confirm();

DROP TRIGGER IF EXISTS update_liaison_job_count_trigger ON public.delivery_jobs;
CREATE TRIGGER update_liaison_job_count_trigger
  AFTER UPDATE ON public.delivery_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_liaison_job_count();
