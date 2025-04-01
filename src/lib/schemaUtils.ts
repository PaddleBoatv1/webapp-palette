
import { supabase } from './supabase';
import schemaSQL from '../db/schema.sql?raw';

/**
 * Execute the SQL schema in the Supabase project
 * This will create all the tables, policies, and indexes defined in the schema
 */
export const executeSchema = async () => {
  try {
    console.log('Beginning schema execution...');
    
    // Split the schema into separate statements by semicolons
    // This is a simple approach and might not work for complex SQL with semicolons in strings
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        const { error } = await supabase.rpc('pgexecute', { 
          query: statement 
        });
        
        if (error) {
          console.error(`Error executing statement ${i + 1}:`, error);
          // Continue with the next statement even if one fails
        } else {
          console.log(`Successfully executed statement ${i + 1}`);
        }
      } catch (stmtError) {
        console.error(`Exception executing statement ${i + 1}:`, stmtError);
      }
    }
    
    console.log('Schema execution completed');
    return { success: true };
  } catch (error) {
    console.error('Failed to execute schema:', error);
    return { success: false, error };
  }
};

/**
 * Check if the schema is already set up by checking for the existence of the users table
 */
export const isSchemaSetup = async () => {
  try {
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('Error checking if schema is set up:', error);
      return false;
    }
    
    return true; // If we got here, the table exists
  } catch (error) {
    console.error('Exception checking if schema is set up:', error);
    return false;
  }
};
