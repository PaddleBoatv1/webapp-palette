
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { User as UserIcon, AlertCircle, Info } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Signup = () => {
  const { loginWithGoogle, isLoading } = useAuth();
  const [oauthError, setOauthError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    try {
      setOauthError(null);
      await loginWithGoogle();
    } catch (error: any) {
      setOauthError(error.message || "Failed to login with Google");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Create an Account</CardTitle>
          <CardDescription className="text-center">
            Sign up for PaddleRide with your Google account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {oauthError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{oauthError}</AlertDescription>
            </Alert>
          )}
          
          <Button
            variant="default"
            type="button"
            className="w-full"
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            <UserIcon className="mr-2 h-4 w-4" />
            Sign up with Google
          </Button>
          
          <Alert variant="default" className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-500" />
            <AlertDescription className="text-sm text-gray-700">
              <p className="mb-1">Important notes:</p>
              <ol className="list-decimal list-inside space-y-1 pl-1">
                <li>Google authentication is the only supported sign-up method</li>
                <li>Ensure Google authentication is properly configured in your Supabase project</li>
              </ol>
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <div className="text-sm text-center w-full text-gray-500">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-600 hover:text-blue-800 font-medium">
              Login
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Signup;
