
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    // Check for error in URL search params
    const errorParam = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    
    if (errorParam) {
      console.error("Auth error from URL:", errorParam, errorDescription);
      setError(errorDescription || `Authentication error: ${errorParam}`);
      toast({
        title: "Authentication Failed",
        description: errorDescription || `Authentication error: ${errorParam}`,
        variant: "destructive",
      });
      
      // Return to login page
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
      
      setProcessing(false);
      return;
    }

    const handleCallback = async () => {
      try {
        console.log("Processing authentication callback");
        
        // Get the hash from the URL or session storage
        let hash = window.location.hash;
        if (!hash && sessionStorage.getItem('auth_hash')) {
          hash = sessionStorage.getItem('auth_hash') || '';
        }
        
        if (hash && hash.includes('access_token')) {
          // Extract tokens from hash
          const hashParams = new URLSearchParams(hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          
          if (!accessToken) {
            throw new Error("Access token not found in URL");
          }
          
          // Set the session with tokens
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });
          
          if (error) {
            throw error;
          }
          
          // Clean up
          sessionStorage.removeItem('auth_hash');
          
          // Get user role
          if (data.user) {
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('role')
              .eq('id', data.user.id)
              .single();
              
            if (userError && userError.code !== 'PGRST116') {
              console.error("Error fetching user role:", userError);
            }
            
            // Success message
            toast({
              title: "Authentication Successful",
              description: "You have been logged in successfully",
            });
            
            // Redirect based on role
            if (userData?.role === 'admin') {
              window.location.href = '/admin';
            } else {
              window.location.href = '/dashboard';
            }
            return;
          }
        }
        
        // Check for existing session as fallback
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }
        
        if (session) {
          console.log("Using existing session");
          
          // Get user role
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single();
            
          if (userError && userError.code !== 'PGRST116') {
            console.error("Error fetching user role:", userError);
          }
          
          // Success message
          toast({
            title: "Authentication Successful",
            description: "You have been logged in successfully",
          });
          
          // Redirect based on role
          if (userData?.role === 'admin') {
            window.location.href = '/admin';
          } else {
            window.location.href = '/dashboard';
          }
          return;
        }
        
        // No valid session could be established
        throw new Error("Authentication failed");
      } catch (error: any) {
        console.error("Authentication callback error:", error);
        setError(error.message || "Authentication failed");
        
        toast({
          title: "Authentication Failed",
          description: error.message || "There was an issue with the authentication flow",
          variant: "destructive",
        });
        
        // Clean up
        sessionStorage.removeItem('auth_hash');
        
        // Redirect to login
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
      } finally {
        setProcessing(false);
      }
    };
    
    // Start processing with slight delay
    const timer = setTimeout(handleCallback, 100);
    return () => clearTimeout(timer);
  }, [navigate, searchParams]);

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
        If you're not redirected automatically, 
        <button 
          onClick={() => {
            sessionStorage.removeItem('auth_hash');
            window.location.href = '/login';
          }} 
          className="ml-1 text-blue-500 hover:underline"
        >
          click here to return to login
        </button>
      </div>
    </div>
  );
};

export default AuthCallback;
