
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
          throw new Error(errorDescription || 'Authentication failed');
        }
        
        // If we got here without a token or error, likely still in progress
        // Supabase handles the session automatically
        // We can just redirect to dashboard and the AuthContext will check the session
        navigate('/dashboard');
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
      </div>
    </div>
  );
};

export default AuthCallback;
