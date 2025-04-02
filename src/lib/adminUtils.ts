
import { supabase } from './supabase';
import { boats, waivers, zones } from '../db/sampleData';

/**
 * Seed the database with sample data
 */
export const seedDatabase = async () => {
  try {
    // Insert sample data into boats table
    if (boats && boats.length > 0) {
      // Fix: Map each boat to ensure all required properties are present
      const boatsToInsert = boats.map(boat => ({
        boat_name: boat.boat_name || 'Unnamed Boat', // Ensure boat_name is present
        status: boat.status || 'available',
        gps_device_id: boat.gps_device_id
      }));
      
      const { error: boatsError } = await supabase
        .from('boats')
        .insert(boatsToInsert);
      
      if (boatsError) throw boatsError;
    }
    
    // Insert sample waivers
    if (waivers && waivers.length > 0) {
      // Fix: Map each waiver to ensure all required properties are present
      const waiversToInsert = waivers.map(waiver => ({
        version_label: waiver.version_label || 'v1.0',
        waiver_text: waiver.waiver_text || 'Default Waiver Text'
      }));
      
      const { error: waiversError } = await supabase
        .from('waivers')
        .insert(waiversToInsert);
      
      if (waiversError) throw waiversError;
    }
    
    // Insert sample zones
    if (zones && zones.length > 0) {
      // Fix: Map each zone to ensure all required properties are present
      const zonesToInsert = zones.map(zone => ({
        zone_name: zone.zone_name || 'Unnamed Zone',
        is_premium: zone.is_premium || false,
        description: zone.description || null,
        coordinates: zone.coordinates || null
      }));
      
      const { error: zonesError } = await supabase
        .from('zones')
        .insert(zonesToInsert);
      
      if (zonesError) throw zonesError;
    }
    
    return true;
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
};
