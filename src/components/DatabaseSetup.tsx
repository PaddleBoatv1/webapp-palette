
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { seedDatabase, createAdminUser } from '@/lib/adminUtils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { executeSchema, isSchemaSetup } from '@/lib/schemaUtils';
import { Separator } from '@/components/ui/separator';
import { InfoCircledIcon } from '@radix-ui/react-icons';

const DatabaseSetup: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminName, setAdminName] = useState('');
  const [schemaExists, setSchemaExists] = useState<boolean | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    const checkSchema = async () => {
      const exists = await isSchemaSetup();
      setSchemaExists(exists);
    };
    
    checkSchema();
  }, [success]);

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

  const validatePassword = (password: string) => {
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return false;
    }
    setPasswordError(null);
    return true;
  };

  const handleCreateAdmin = async () => {
    if (!adminEmail || !adminPassword || !adminName) {
      setError('Please fill in all admin user fields');
      return;
    }

    if (!validatePassword(adminPassword)) {
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const admin = await createAdminUser(adminEmail, adminPassword, adminName);
      if (admin) {
        toast({
          title: "Admin Created",
          description: `Admin user ${adminEmail} has been created successfully.`,
        });
        setError(null);
      } else {
        throw new Error('Failed to create admin user');
      }
    } catch (err: any) {
      console.error('Error creating admin:', err);
      let errorMessage = 'Failed to create admin user. Check console for details.';
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err.error_description) {
        errorMessage = err.error_description;
      } else if (typeof err === 'object') {
        errorMessage = JSON.stringify(err);
      }
      
      setError(errorMessage);
      toast({
        title: "Admin Creation Failed",
        description: errorMessage,
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
            <Alert>
              <AlertTitle>Schema Exists</AlertTitle>
              <AlertDescription>
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
                <li>Create a new SQL function in the SQL Editor called <code>exec_sql</code>:</li>
                <pre className="bg-slate-100 p-2 rounded text-xs mt-1 mb-2 overflow-x-auto">
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
                <li>Enable this function for RPC calls:</li>
                <pre className="bg-slate-100 p-2 rounded text-xs mt-1 overflow-x-auto">
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
            {loading ? 'Creating Schema...' : 'Create Database Schema'}
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
          {success && !error && (
            <Alert>
              <AlertTitle>Success!</AlertTitle>
              <AlertDescription>
                Database has been initialized with sample data.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Create Admin User</h3>
            <div className="grid gap-2">
              <Label htmlFor="adminEmail">Admin Email</Label>
              <Input
                id="adminEmail"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@example.com"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="adminPassword">Admin Password</Label>
              <Input
                id="adminPassword"
                type="password"
                value={adminPassword}
                onChange={(e) => {
                  setAdminPassword(e.target.value);
                  validatePassword(e.target.value);
                }}
                placeholder="••••••••"
              />
              {passwordError && (
                <p className="text-sm text-red-500">{passwordError}</p>
              )}
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="adminName">Admin Name</Label>
              <Input
                id="adminName"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                placeholder="Admin User"
              />
            </div>
            
            <Button 
              onClick={handleCreateAdmin} 
              disabled={loading || !adminEmail || !adminPassword || !adminName || !schemaExists || adminPassword.length < 6}
              className="w-full"
            >
              {loading ? 'Creating...' : 'Create Admin User'}
            </Button>
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
