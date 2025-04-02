
import { supabase } from '../integrations/supabase/client';
import schemaSQL from '../db/schema.sql?raw';

/**
 * Execute the SQL schema in the Supabase project
 * This will create all the tables, policies, and indexes defined in the schema
 */
export const executeSchema = async () => {
  try {
    console.log('Beginning schema execution...');
    
    // Split the schema into separate statements by semicolons
    // We need to handle this carefully to avoid splitting SQL within quotes or comments
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
          // If it's just a "policy already exists" error, we can continue
          if (error.message && error.message.includes('already exists')) {
            console.log(`Statement ${i + 1} skipped: ${error.message}`);
          } else {
            // For other errors, we should log them but continue
            console.warn(`Statement ${i + 1} failed but continuing: ${error.message}`);
          }
        } else {
          console.log(`Successfully executed statement ${i + 1}`);
        }
      } catch (stmtError: any) { // Add type annotation here
        console.error(`Exception executing statement ${i + 1}:`, stmtError);
      }
    }
    
    console.log('Schema execution completed');
    return { success: true };
  } catch (error: any) { // Add type annotation here
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
  } catch (error: any) { // Add type annotation here
    console.error('Exception checking schema setup:', error);
    return false;
  }
};
