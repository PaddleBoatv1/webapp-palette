
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
    
    // Execute each statement directly using the REST API
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        // Execute each SQL statement directly using Supabase SQL query
        const { error } = await supabase.rpc('exec_sql', { 
          sql_query: statement 
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
 * Check if the schema is already set up by checking if any tables exist
 */
export const isSchemaSetup = async () => {
  try {
    // Try to query the boats table which should exist if schema is set up
    const { data, error } = await supabase
      .from('boats')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('Error checking schema setup:', error);
      return false;
    }
    
    // If we can query the boats table, schema is set up
    return true;
  } catch (error) {
    console.error('Exception checking schema setup:', error);
    return false;
  }
};
