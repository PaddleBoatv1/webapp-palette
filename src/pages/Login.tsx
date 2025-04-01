
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { User, LogIn, AlertCircle, Info } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login = () => {
  const { login, loginWithGoogle, isLoading } = useAuth();
  const [oauthError, setOauthError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    await login(data.email, data.password);
  };

  const handleGoogleLogin = async () => {
    try {
      setOauthError(null);
      console.log("Initiating Google login flow");
      await loginWithGoogle();
    } catch (error: any) {
      setOauthError(error.message || "Failed to login with Google");
      console.error("Google login error:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Login to PaddleRide</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your account
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
            variant="outline"
            type="button"
            className="w-full"
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            <User className="mr-2 h-4 w-4" />
            {isLoading ? "Please wait..." : "Continue with Google"}
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="******" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <LogIn className="mr-2 h-4 w-4" />
                    Login
                  </div>
                )}
              </Button>
            </form>
          </Form>
          
          <Alert variant="default" className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-500" />
            <AlertDescription className="text-sm text-gray-700">
              <p className="font-semibold mb-1">Google Sign-In Setup Checklist:</p>
              <ol className="list-decimal list-inside space-y-1 pl-1">
                <li>Enable Google provider in Supabase Authentication → Providers</li>
                <li>Add your Google OAuth credentials (Client ID & Secret)</li>
                <li>Add these callback URLs to your Google OAuth Authorized redirect URIs:
                  <ul className="list-disc list-inside ml-4 mt-1 space-y-1 text-xs break-all">
                    <li><code className="bg-blue-100 px-1 py-0.5 rounded">https://vstqtcvwnvkcdrxteubg.supabase.co/auth/v1/callback</code></li>
                    <li><code className="bg-blue-100 px-1 py-0.5 rounded">http://localhost:3000/auth/callback</code></li>
                  </ul>
                </li>
                <li>Make sure the Origin URIs include <code className="bg-blue-100 px-1 py-0.5 rounded text-xs">http://localhost:3000</code></li>
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
          <div className="text-sm text-center text-gray-500">
            <Link to="/forgot-password" className="text-blue-600 hover:text-blue-800 font-medium">
              Forgot your password?
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
