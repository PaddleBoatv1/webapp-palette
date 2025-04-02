
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Ship, Loader2 } from 'lucide-react';

const LiaisonSignup = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phoneNumber: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Register the user
      const { error, data } = await signup(
        formData.email, 
        formData.password,
        {
          full_name: formData.fullName,
          phone_number: formData.phoneNumber,
          role: 'liaison'  // Set role as liaison
        }
      );
      
      if (error) throw error;
      
      if (data.user) {
        // Create a liaison record in company_liaisons table
        const { error: liaisonError } = await supabase
          .from('company_liaisons')
          .insert([{ 
            user_id: data.user.id,
            is_active: true,
            current_job_count: 0,
            max_concurrent_jobs: 3
          }]);
        
        if (liaisonError) throw liaisonError;
        
        toast({
          title: 'Registration successful',
          description: 'You have been registered as a delivery executive. Please wait for admin approval.',
        });
        
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Error during signup:', error);
      toast({
        title: 'Registration failed',
        description: error.message || 'Something went wrong during signup.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-4">
        <Card>
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <Ship className="h-12 w-12 text-blue-500" />
            </div>
            <CardTitle className="text-2xl text-center">Delivery Executive Signup</CardTitle>
            <CardDescription className="text-center">
              Join our team of delivery executives to help deliver and pick up paddleboats
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="example@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="********"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    autoComplete="new-password"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    placeholder="+1-234-567-8900"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing up...
                    </>
                  ) : (
                    "Sign up as Delivery Executive"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
          <CardFooter>
            <div className="text-center text-sm text-gray-500 w-full">
              Already have an account?{' '}
              <Link to="/login" className="underline text-blue-500">
                Login
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default LiaisonSignup;
