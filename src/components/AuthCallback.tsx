
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the authorization code from the URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const queryParams = new URLSearchParams(window.location.search);
        
        // Check if there's an access_token (successful login)
        if (hashParams.has('access_token')) {
          toast({
            title: "Authentication Successful",
            description: "You have been logged in successfully."
          });
          navigate('/dashboard');
          return;
        }
        
        // Check if there's an error
        const error = queryParams.get('error') || hashParams.get('error');
        if (error) {
          console.error('OAuth error:', error);
          const errorDescription = queryParams.get('error_description') || hashParams.get('error_description');
          
          // If the error is about the provider not being enabled, give a more helpful message
          if (errorDescription?.includes('provider is not enabled')) {
            throw new Error('Google authentication is not enabled in your Supabase project. Please configure the Google provider in your Supabase dashboard.');
          }
          
          throw new Error(errorDescription || 'Authentication failed');
        }
        
        // If we got here without a token or error, let's get the session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }
        
        if (session) {
          toast({
            title: "Authentication Successful",
            description: "You have been logged in successfully."
          });
          navigate('/dashboard');
        } else {
          // No session found, redirect back to login
          navigate('/login');
        }
      } catch (error: any) {
        console.error('Error processing OAuth callback:', error);
        toast({
          title: "Authentication Failed",
          description: error.message || "There was an issue authenticating.",
          variant: "destructive",
        });
        navigate('/login');
      }
    };
    
    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Authenticating...</h1>
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4 text-gray-500">You will be redirected shortly...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
