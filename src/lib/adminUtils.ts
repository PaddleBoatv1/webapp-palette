
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

/**
 * Create an admin user with the provided credentials
 */
export const createAdminUser = async (email: string, password: string, fullName: string) => {
  try {
    // First, create the user in Supabase Auth system
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
    
    if (authError) throw authError;
    
    if (!authData.user) {
      throw new Error('Failed to create user in auth system');
    }
    
    // Check if the user was already registered
    if (authData.user.identities && authData.user.identities.length === 0) {
      throw new Error('Email already registered. Please use a different email address.');
    }
    
    // Update or insert the user in the users table with admin role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .upsert({
        id: authData.user.id,
        email: email,
        full_name: fullName,
        role: 'admin',
      }, { onConflict: 'id' });
    
    if (userError) throw userError;
    
    return { 
      id: authData.user.id,
      email,
      fullName,
      role: 'admin'
    };
  } catch (error) {
    console.error('Error creating admin user:', error);
    throw error;
  }
};
