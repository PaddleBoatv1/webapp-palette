
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, Info, User as UserIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Alert, AlertDescription } from "@/components/ui/alert";

const LiaisonSignup = () => {
  const navigate = useNavigate();
  const { loginWithGoogle, isLoading } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      // Store the liaison registration data in localStorage so we can access it after Google auth callback
      localStorage.setItem('liaison_registration', JSON.stringify({
        name,
        phone,
        termsAccepted
      }));
      
      await loginWithGoogle();
      // The actual registration will happen in the AuthCallback component after successful Google login
    } catch (error: any) {
      setError(error.message || "Failed to login with Google");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Become a Delivery Executive</CardTitle>
          <CardDescription className="text-center">
            Join our team and help deliver paddleboats to customers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input 
              id="name" 
              placeholder="Enter your full name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input 
              id="phone" 
              placeholder="Enter your phone number" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox 
              id="terms" 
              checked={termsAccepted} 
              onCheckedChange={(checked) => setTermsAccepted(checked === true)}
            />
            <label
              htmlFor="terms"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I agree to the terms and conditions as a delivery executive
            </label>
          </div>
          
          <Button
            variant="default"
            type="button"
            className="w-full mt-4"
            disabled={!name || !phone || !termsAccepted || isLoading || isSubmitting}
            onClick={handleGoogleLogin}
          >
            <UserIcon className="mr-2 h-4 w-4" />
            Continue with Google
          </Button>
          
          <Alert variant="default" className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-500" />
            <AlertDescription className="text-sm text-gray-700">
              <p className="mb-1">Important notes:</p>
              <ol className="list-disc list-inside space-y-1 pl-1">
                <li>You must provide a valid phone number for delivery coordination</li>
                <li>Our team will verify your information before activating your account</li>
              </ol>
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <div className="text-sm text-center w-full text-gray-500">
            Already a delivery executive?{" "}
            <Link to="/login" className="text-blue-600 hover:text-blue-800 font-medium">
              Login
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LiaisonSignup;
