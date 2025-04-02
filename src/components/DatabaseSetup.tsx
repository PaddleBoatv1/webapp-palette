
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { seedDatabase } from '@/lib/adminUtils';
import { toast } from '@/hooks/use-toast';
import { executeSchema, isSchemaSetup } from '@/lib/schemaUtils';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { User, InfoCircledIcon, CheckCircledIcon } from '@radix-ui/react-icons';

const DatabaseSetup: React.FC = () => {
  const { user, loginWithGoogle, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [schemaExists, setSchemaExists] = useState<boolean | null>(null);
  const [adminCreated, setAdminCreated] = useState(false);
  const [dbSeeded, setDbSeeded] = useState(false);

  useEffect(() => {
    const checkSchema = async () => {
      const exists = await isSchemaSetup();
      setSchemaExists(exists);
    };
    
    checkSchema();
  }, [success]);

  // Check if the current user is already an admin
  useEffect(() => {
    if (user && user.role === 'admin') {
      setAdminCreated(true);
    }
  }, [user]);

  const handleSchemaSetup = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await executeSchema();
      if (result.success) {
        setSuccess(true);
        setSchemaExists(true);
        toast({
          title: "Schema Created",
          description: "Database schema has been successfully created.",
        });
      } else {
        throw new Error('Failed to create schema');
      }
    } catch (err) {
      console.error('Error creating schema:', err);
      setError('Failed to create database schema. Check console for details.');
      toast({
        title: "Schema Creation Failed",
        description: "There was an error creating the database schema.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSeedDatabase = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await seedDatabase();
      setSuccess(true);
      setDbSeeded(true);
      toast({
        title: "Database Initialized",
        description: "Sample data has been added to your database.",
      });
    } catch (err) {
      console.error('Error seeding database:', err);
      setError('Failed to seed database. Check console for details.');
      toast({
        title: "Database Setup Failed",
        description: "There was an error initializing the database.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePromoteToAdmin = async () => {
    if (!user) {
      setError("You must be logged in to become an admin");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Update the user's role to admin in the database
      const { error: updateError } = await supabase
        .from('users')
        .update({ role: 'admin' })
        .eq('id', user.id);
        
      if (updateError) throw updateError;
      
      // Update local state to reflect the change
      setAdminCreated(true);
      
      toast({
        title: "Admin Created",
        description: `Your account has been promoted to admin. Please log out and log back in for the changes to take effect.`,
      });
    } catch (err: any) {
      console.error('Error promoting to admin:', err);
      setError(err.message || 'Failed to promote user to admin');
      toast({
        title: "Admin Creation Failed",
        description: err.message || "There was an error promoting your account to admin.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Database Schema Setup</CardTitle>
          <CardDescription>
            Create the database structure in your Supabase project
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {schemaExists === true && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircledIcon className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-700">Schema Exists</AlertTitle>
              <AlertDescription className="text-green-600">
                The database schema is already set up in your Supabase project.
              </AlertDescription>
            </Alert>
          )}
          
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <Alert>
            <InfoCircledIcon className="h-4 w-4 mr-2" />
            <AlertTitle>Important Setup Steps</AlertTitle>
            <AlertDescription className="mt-2">
              <p>Before proceeding, ensure you've completed these steps in your Supabase project:</p>
              <ol className="list-decimal list-inside mt-2 ml-2 space-y-1">
                <li>
                  Create a new SQL function in the SQL Editor called <code>exec_sql</code>:
                </li>
                <pre className="bg-slate-100 p-2 rounded-md mt-1 mb-2 overflow-x-auto">
                  {`CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql_query;
END;
$$;`}
                </pre>
                <li>
                  Enable this function for RPC calls:
                </li>
                <pre className="bg-slate-100 p-2 rounded-md mt-1 overflow-x-auto">
                  {`CREATE OR REPLACE FUNCTION public.exec_sql(sql_query text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  EXECUTE sql_query;
END;
$function$;`}
                </pre>
              </ol>
            </AlertDescription>
          </Alert>
          
          <p className="text-sm text-muted-foreground">
            This will create all necessary tables, policies, and indexes in your Supabase project.
            This is a required step before adding sample data or creating users.
          </p>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleSchemaSetup}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Creating Schema...' : schemaExists ? 'Recreate Schema' : 'Create Database Schema'}
          </Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Paddle Boat Rental Database Setup</CardTitle>
          <CardDescription>
            Initialize your database with sample data for testing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {adminCreated && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircledIcon className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-700">Admin Created</AlertTitle>
              <AlertDescription className="text-green-600">
                Your account has been set as an admin. Log out and log back in for the changes to take effect.
              </AlertDescription>
            </Alert>
          )}
          
          {dbSeeded && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircledIcon className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-700">Database Seeded</AlertTitle>
              <AlertDescription className="text-green-600">
                Sample data has been added to your database.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Create Admin User</h3>
            
            {!isAuthenticated ? (
              <div className="text-center">
                <p className="mb-4">Sign in with Google to create an admin account</p>
                <Button 
                  onClick={loginWithGoogle} 
                  disabled={loading}
                  className="w-full"
                >
                  <User className="mr-2 h-4 w-4" />
                  Sign in with Google
                </Button>
              </div>
            ) : (
              <div>
                <Alert className="mb-4 bg-blue-50 border-blue-200">
                  <InfoCircledIcon className="h-4 w-4 text-blue-500" />
                  <AlertDescription className="text-sm text-gray-700">
                    Logged in as: <span className="font-semibold">{user?.email}</span>
                  </AlertDescription>
                </Alert>
                
                <Button 
                  onClick={handlePromoteToAdmin}
                  disabled={loading || adminCreated || !schemaExists}
                  className="w-full"
                >
                  {loading ? 'Promoting...' : adminCreated ? 'Already an Admin' : 'Promote to Admin'}
                </Button>
                
                {adminCreated && (
                  <p className="text-sm text-green-600 mt-2 text-center">
                    You now have admin privileges. You may need to log out and log back in for all changes to take effect.
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleSeedDatabase}
            disabled={loading || !schemaExists}
            className="w-full"
          >
            {loading ? 'Initializing...' : 'Initialize Database with Sample Data'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default DatabaseSetup;
