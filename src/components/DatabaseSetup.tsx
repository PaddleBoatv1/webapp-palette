
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { seedDatabase, createAdminUser } from '@/lib/adminUtils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

const DatabaseSetup: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminName, setAdminName] = useState('');

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
          
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
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
              disabled={loading || !adminEmail || !adminPassword || !adminName}
              className="w-full"
            >
              {loading ? 'Creating...' : 'Create Admin User'}
            </Button>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleSeedDatabase}
            disabled={loading}
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
