
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log("Auth callback triggered. Processing auth response...");
        console.log("Current URL:", window.location.href);
        
        // First try to get the hash from the URL
        let hash = location.hash;
        
        // If no hash in the URL, check session storage (it might have been stored there during redirect)
        if (!hash && sessionStorage.getItem('auth_hash')) {
          hash = sessionStorage.getItem('auth_hash') || '';
          console.log("Retrieved hash from session storage");
        }
        
        console.log("Hash present:", !!hash);
        
        // If we have a hash with access_token, process it
        if (hash && hash.includes('access_token')) {
          console.log("Processing hash with access token");
          
          // Extract token from hash (remove # at start)
          const hashParams = new URLSearchParams(hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          
          if (!accessToken) {
            console.error("No access token found in URL hash");
            throw new Error("Access token not found in URL");
          }
          
          console.log("Access token found, setting session");
          
          // Set the session with tokens from URL
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });
          
          if (error) {
            console.error("Error setting session with token:", error);
            throw error;
          }
          
          if (data.session) {
            console.log("Session established with user:", data.session.user.id);
            
            // Clean up session storage
            sessionStorage.removeItem('auth_hash');
            
            // Process user profile
            await processUser(data.session.user.id);
            
            // Clear any existing redirect timeouts
            if (window._redirectTimeout) {
              clearTimeout(window._redirectTimeout);
            }
            
            // Force navigation to dashboard
            console.log("Redirecting to dashboard now");
            window._redirectTimeout = setTimeout(() => {
              navigate('/dashboard', { replace: true });
            }, 500);
            
            return;
          } else {
            console.error("No session established after setting token");
            throw new Error("Failed to establish session with token");
          }
        }
        
        // Fallback: try to get existing session
        console.log("No token in hash or token processing failed, checking for existing session");
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Error getting existing session:", sessionError);
          throw sessionError;
        }
        
        if (session) {
          console.log("Existing session found for user:", session.user.id);
          await processUser(session.user.id);
          
          // Clear any existing redirect timeouts
          if (window._redirectTimeout) {
            clearTimeout(window._redirectTimeout);
          }
          
          // Force navigation to dashboard
          console.log("Redirecting to dashboard now with existing session");
          window._redirectTimeout = setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 500);
          
          return;
        }
        
        // If we got here, authentication failed
        console.log("No session could be established");
        throw new Error("Authentication failed");
        
      } catch (error: any) {
        console.error("Authentication callback error:", error);
        setError(error.message || "Authentication failed");
        toast({
          title: "Authentication Failed",
          description: error.message || "There was an issue with the authentication flow",
          variant: "destructive",
        });
        
        // Clean up session storage on error
        sessionStorage.removeItem('auth_hash');
        
        // Navigate to login on error
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 2000);
      } finally {
        setProcessing(false);
      }
    };
    
    // Helper function to ensure user exists in the users table
    const processUser = async (userId: string) => {
      try {
        console.log("Processing user:", userId);
        
        // Check if user exists in users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();
          
        // If user not found, create profile
        if (userError && userError.code === 'PGRST116') {
          console.log("User not found in users table, creating profile");
          
          // Get user details from auth
          const { data: authData } = await supabase.auth.getUser();
          if (!authData.user) {
            console.error("User data not available");
            throw new Error("User data not available");
          }
          
          console.log("Auth user data:", authData.user);
          
          // Insert user into users table
          const { error: insertError } = await supabase
            .from('users')
            .insert([{
              id: userId,
              email: authData.user.email,
              full_name: authData.user.user_metadata?.full_name || 
                        authData.user.user_metadata?.name || 
                        authData.user.email?.split('@')[0] || '',
              role: authData.user.user_metadata?.role || 'customer' // Default role
            }]);
            
          if (insertError) {
            console.error("Error creating user profile:", insertError);
            // Continue anyway as auth is successful
          } else {
            console.log("User profile created successfully");
          }
        } else {
          console.log("User already exists in users table");
        }
        
        // Show success toast
        toast({
          title: "Authentication Successful",
          description: "You have been logged in successfully.",
        });
        
        console.log("Redirecting to dashboard...");
      } catch (err) {
        console.error("Error processing user:", err);
        throw err;
      }
    };
    
    // Add a small delay before processing to ensure context is properly initialized
    const timer = setTimeout(() => {
      handleCallback();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [navigate, location.hash]);

  // Add more visible loading and error states
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <div className="text-center">
          {error ? (
            <>
              <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h1>
              <p className="text-gray-600 mb-4">{error}</p>
              <div className="animate-pulse text-sm text-gray-500">Redirecting to login page...</div>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold mb-4">Authenticating...</h1>
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-4 text-gray-500">
                {processing ? "Please wait while we complete your authentication" : "Authentication complete, redirecting..."}
              </p>
            </>
          )}
        </div>
      </div>
      <div className="mt-4 text-sm text-gray-500">
        If you're not redirected automatically, <button onClick={() => navigate('/dashboard')} className="text-blue-500 hover:underline">click here</button>
      </div>
    </div>
  );
};

// Add a type declaration for the _redirectTimeout property on the window object
declare global {
  interface Window {
    _redirectTimeout?: ReturnType<typeof setTimeout>;
  }
}

export default AuthCallback;
