
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { AlertCircle, Info, RefreshCw, User as UserIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Login = () => {
  const { loginWithGoogle, isLoading, clearAllAuthData } = useAuth();
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [clearingSession, setClearingSession] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setOauthError(null);
      await loginWithGoogle();
    } catch (error: any) {
      setOauthError(error.message || "Failed to login with Google");
    }
  };

  const handleClearSession = async () => {
    setClearingSession(true);
    try {
      await clearAllAuthData();
      setClearingSession(false);
      // No need to use window.location.href as it causes full page reloads
    } catch (error) {
      console.error("Error during force clear:", error);
      setClearingSession(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Login to PaddleRide</CardTitle>
          <CardDescription className="text-center">
            Sign in with your Google account to access PaddleRide
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
            disabled={isLoading || clearingSession}
          >
            <UserIcon className="mr-2 h-4 w-4" />
            {isLoading ? "Please wait..." : "Sign in with Google"}
          </Button>
          
          <div className="mt-4">
            <Button 
              variant="destructive" 
              size="sm" 
              className="w-full" 
              onClick={handleClearSession}
              disabled={clearingSession}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${clearingSession ? 'animate-spin' : ''}`} />
              {clearingSession ? "Clearing..." : "Reset Authentication State"}
            </Button>
            <p className="text-xs text-gray-500 mt-1 text-center">
              Use this if you're stuck in an authentication loop
            </p>
          </div>
          
          <Alert variant="default" className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-500" />
            <AlertDescription className="text-sm text-gray-700">
              <p className="font-semibold mb-1">Google Sign-In Setup Checklist:</p>
              <ol className="list-decimal list-inside space-y-1 pl-1">
                <li>Set these URLs in Supabase Authentication → URL Configuration:
                  <ul className="list-disc list-inside ml-4 mt-1 space-y-1 text-xs">
                    <li>Site URL: <code className="bg-blue-100 px-1 py-0.5 rounded">{window.location.origin}</code></li>
                    <li>Redirect URLs: <code className="bg-blue-100 px-1 py-0.5 rounded">{window.location.origin}/auth/callback</code></li>
                  </ul>
                </li>
                <li>Add the same redirect URL to your Google OAuth settings</li>
              </ol>
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center text-gray-500">
            Don't have an account?{" "}
            <Link to="/signup" className="text-blue-600 hover:text-blue-800 font-medium">
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
