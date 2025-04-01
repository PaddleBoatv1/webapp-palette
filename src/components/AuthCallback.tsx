
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log("Auth callback triggered. Processing auth response...");
        
        // Get the hash fragment (from the current URL or original window)
        let hash = window.location.hash;
        let search = window.location.search;
        
        // Get hash from current URL or via the redirected URL
        if (!hash && search && search.includes('code=')) {
          console.log("OAuth code found in search params, checking for hash...");
          // We might be in a code flow without hash
          const params = new URLSearchParams(search);
          if (params.has('code')) {
            // Let Supabase exchange the code
            console.log("Letting Supabase handle code exchange...");
            const { data, error } = await supabase.auth.getSession();
            
            if (error) {
              console.error("Error getting session from code:", error);
              throw error;
            }
            
            if (data.session) {
              console.log("Session established from code flow:", data.session.user.id);
              await processUser(data.session.user.id);
              return;
            }
          }
        }
        
        // If we have a hash with access_token, process it
        if (hash && hash.includes('access_token')) {
          console.log("Found access_token in hash, processing...");
          
          // Extract token from hash (remove # at start)
          const hashParams = new URLSearchParams(hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          
          if (!accessToken) {
            throw new Error("Access token not found in URL");
          }
          
          console.log("Setting session with token from hash");
          
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
            await processUser(data.session.user.id);
            return;
          } else {
            throw new Error("Failed to establish session with token");
          }
        }
        
        // Fallback: try to get existing session
        console.log("No token in URL, checking for existing session");
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Error getting existing session:", sessionError);
          throw sessionError;
        }
        
        if (session) {
          console.log("Existing session found for user:", session.user.id);
          await processUser(session.user.id);
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
        
        // Wait a moment before redirecting on error
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    };
    
    // Helper function to ensure user exists in the users table
    const processUser = async (userId: string) => {
      try {
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
          if (!authData.user) throw new Error("User data not available");
          
          // Insert user into users table
          const { error: insertError } = await supabase
            .from('users')
            .insert([{
              id: userId,
              email: authData.user.email,
              full_name: authData.user.user_metadata?.full_name || 
                         authData.user.user_metadata?.name || 
                         authData.user.email?.split('@')[0] || '',
              role: 'customer' // Default role
            }]);
            
          if (insertError) {
            console.error("Error creating user profile:", insertError);
            // Continue anyway as auth is successful
          }
        }
        
        // Show success toast and redirect
        toast({
          title: "Authentication Successful",
          description: "You have been logged in successfully.",
        });
        
        // Navigate to dashboard
        navigate('/dashboard');
      } catch (err) {
        console.error("Error processing user:", err);
        throw err;
      }
    };
    
    handleCallback();
  }, [navigate, location]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
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
              <p className="mt-4 text-gray-500">Please wait while we complete your authentication</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;
