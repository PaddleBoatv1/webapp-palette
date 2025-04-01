
import { supabase } from './supabase';

// Seed a sample waiver
export const seedWaiver = async () => {
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
};

// Seed sample zones
export const seedZones = async () => {
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
};

// Seed sample boats
export const seedBoats = async () => {
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
};

// Create an admin user (for testing)
export const createAdminUser = async (email: string, password: string, fullName: string) => {
  // 1. Create the auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password
  });
  
  if (authError) {
    console.error('Error creating admin auth user:', authError);
    return null;
  }
  
  if (!authData.user) {
    console.error('No user returned from auth signup');
    return null;
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
    return null;
  }
  
  return userData;
};

// Utility function to run all seed operations
export const seedDatabase = async () => {
  console.log('Starting database seeding...');
  
  await seedWaiver();
  console.log('Waivers seeded');
  
  await seedZones();
  console.log('Zones seeded');
  
  await seedBoats();
  console.log('Boats seeded');
  
  console.log('Database seeding completed');
};
