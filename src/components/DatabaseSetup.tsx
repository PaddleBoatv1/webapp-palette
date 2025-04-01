
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

const DatabaseSetup: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminName, setAdminName] = useState('');
  const [schemaExists, setSchemaExists] = useState<boolean | null>(null);

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

  const handleCreateAdmin = async () => {
    if (!adminEmail || !adminPassword || !adminName) {
      setError('Please fill in all admin user fields');
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
      } else {
        throw new Error('Failed to create admin user');
      }
    } catch (err) {
      console.error('Error creating admin:', err);
      setError('Failed to create admin user. Check console for details.');
      toast({
        title: "Admin Creation Failed",
        description: "There was an error creating the admin user.",
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
          
          <p className="text-sm text-muted-foreground">
            This will create all necessary tables, policies, and indexes in your Supabase project.
            This is a required step before adding sample data or creating users.
          </p>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleSchemaSetup}
            disabled={loading || schemaExists === true}
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
          {success && (
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
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="••••••••"
              />
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
              disabled={loading || !adminEmail || !adminPassword || !adminName || schemaExists !== true}
              className="w-full"
            >
              {loading ? 'Creating...' : 'Create Admin User'}
            </Button>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleSeedDatabase}
            disabled={loading || schemaExists !== true}
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
