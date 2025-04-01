
import { supabase } from './supabase';

// Seed a sample waiver
export const seedWaiver = async () => {
  try {
    console.log('Creating waivers table if it doesn\'t exist...');
    
    // Check if the table exists and create it if needed
    const { data: tableExists, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'waivers')
      .single();
    
    if (checkError && !tableExists) {
      console.log('Creating waivers table...');
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS public.waivers (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          version_label TEXT NOT NULL,
          waiver_text TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT now()
        );
      `;
      
      const { error: createError } = await supabase.rpc('exec_sql', { 
        sql_query: createTableQuery 
      });
      
      if (createError) {
        console.error('Error creating waivers table:', createError);
        return null;
      }
    }
    
    // Now insert the waiver
    const { data, error } = await supabase
      .from('waivers')
      .insert([
        {
          version_label: 'v1.0',
          waiver_text: `
          # Paddle Boat Rental Waiver and Release of Liability

          By accepting this waiver, I acknowledge the inherent risks associated with paddle boat activities and water sports. I understand that:

          1. Water activities may involve risk of serious injury, drowning, or death.
          2. Weather conditions may change rapidly and affect safety.
          3. I am responsible for wearing a life jacket at all times while on the water.
          4. I must follow all safety guidelines provided by the company.
          
          I hereby release and discharge the company from any liability, claims, or causes of action arising from my participation in paddle boat activities.
          
          I agree to use the paddle boat in a responsible manner and return it in the same condition as when received, minus normal wear and tear.
          
          I confirm that I can swim and am physically fit to participate in this activity.
          `
        }
      ])
      .select()
      .single();
      
    if (error) {
      console.error('Error seeding waiver:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Exception seeding waiver:', error);
    return null;
  }
};

// Seed sample zones
export const seedZones = async () => {
  try {
    console.log('Creating zones table if it doesn\'t exist...');
    
    // Check if the table exists and create it if needed
    const { data: tableExists, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'zones')
      .single();
    
    if (checkError && !tableExists) {
      console.log('Creating zones table...');
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS public.zones (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          zone_name TEXT NOT NULL,
          is_premium BOOLEAN DEFAULT false,
          description TEXT,
          coordinates JSONB,
          created_at TIMESTAMPTZ DEFAULT now(),
          updated_at TIMESTAMPTZ DEFAULT now()
        );
      `;
      
      const { error: createError } = await supabase.rpc('exec_sql', { 
        sql_query: createTableQuery 
      });
      
      if (createError) {
        console.error('Error creating zones table:', createError);
        return null;
      }
    }
    
    const { data, error } = await supabase
      .from('zones')
      .insert([
        {
          zone_name: 'Downtown Riverfront',
          is_premium: true,
          description: 'Prime location in the heart of downtown with scenic views',
          coordinates: {
            center: { lat: 43.651070, lng: -79.347015 },
            radius: 1000
          }
        },
        {
          zone_name: 'Harbor Bay',
          is_premium: false,
          description: 'Peaceful bay area with calm waters',
          coordinates: {
            center: { lat: 43.636166, lng: -79.383184 },
            radius: 1200
          }
        },
        {
          zone_name: 'Sunset Cove',
          is_premium: true,
          description: 'Best spot to enjoy beautiful sunset views',
          coordinates: {
            center: { lat: 43.627910, lng: -79.352860 },
            radius: 800
          }
        }
      ])
      .select();
      
    if (error) {
      console.error('Error seeding zones:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Exception seeding zones:', error);
    return null;
  }
};

// Seed sample boats
export const seedBoats = async () => {
  try {
    console.log('Creating boats table if it doesn\'t exist...');
    
    // Check if the table exists and create it if needed
    const { data: tableExists, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'boats')
      .single();
    
    if (checkError && !tableExists) {
      console.log('Creating boats table...');
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS public.boats (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          boat_name TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'in_use', 'maintenance')),
          gps_device_id TEXT,
          created_at TIMESTAMPTZ DEFAULT now(),
          updated_at TIMESTAMPTZ DEFAULT now()
        );
      `;
      
      const { error: createError } = await supabase.rpc('exec_sql', { 
        sql_query: createTableQuery 
      });
      
      if (createError) {
        console.error('Error creating boats table:', createError);
        return null;
      }
    }
    
    const { data, error } = await supabase
      .from('boats')
      .insert([
        {
          boat_name: 'Blue Voyager',
          status: 'available',
          gps_device_id: 'GPS-001'
        },
        {
          boat_name: 'Red Adventurer',
          status: 'available',
          gps_device_id: 'GPS-002'
        },
        {
          boat_name: 'Yellow Cruiser',
          status: 'available',
          gps_device_id: 'GPS-003'
        },
        {
          boat_name: 'Green Explorer',
          status: 'available',
          gps_device_id: 'GPS-004'
        },
        {
          boat_name: 'Purple Drifter',
          status: 'maintenance',
          gps_device_id: 'GPS-005'
        }
      ])
      .select();
      
    if (error) {
      console.error('Error seeding boats:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Exception seeding boats:', error);
    return null;
  }
};

// Create an admin user (for testing)
export const createAdminUser = async (email: string, password: string, fullName: string) => {
  try {
    // 1. Create the auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: 'admin'
        }
      }
    });
    
    if (authError) {
      console.error('Error creating admin auth user:', authError);
      throw authError;
    }
    
    if (!authData.user) {
      const error = new Error('No user returned from auth signup');
      console.error(error);
      throw error;
    }
    
    // 2. Create the user profile with admin role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([
        {
          id: authData.user.id,
          email,
          full_name: fullName,
          role: 'admin'
        }
      ])
      .select()
      .single();
      
    if (userError) {
      console.error('Error creating admin user profile:', userError);
      throw userError;
    }
    
    return userData;
  } catch (error) {
    console.error('Exception creating admin user:', error);
    throw error;
  }
};

// Utility function to run all seed operations
export const seedDatabase = async () => {
  console.log('Starting database seeding...');
  
  const waiver = await seedWaiver();
  console.log('Waivers seeded');
  
  const zones = await seedZones();
  console.log('Zones seeded');
  
  const boats = await seedBoats();
  console.log('Boats seeded');
  
  console.log('Database seeding completed');
  
  return {
    waiver,
    zones,
    boats
  };
};
