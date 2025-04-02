
import { supabase } from './supabase';
import { boats, waivers, zones } from '../db/sampleData';

/**
 * Seed the database with sample data
 */
export const seedDatabase = async () => {
  try {
    // Insert sample data into boats table
    if (boats && boats.length > 0) {
      const { error: boatsError } = await supabase
        .from('boats')
        .insert(boats);
      
      if (boatsError) throw boatsError;
    }
    
    // Insert sample waivers
    if (waivers && waivers.length > 0) {
      const { error: waiversError } = await supabase
        .from('waivers')
        .insert(waivers);
      
      if (waiversError) throw waiversError;
    }
    
    // Insert sample zones
    if (zones && zones.length > 0) {
      const { error: zonesError } = await supabase
        .from('zones')
        .insert(zones);
      
      if (zonesError) throw zonesError;
    }
    
    return true;
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
};
