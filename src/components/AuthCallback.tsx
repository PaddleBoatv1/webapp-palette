
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log("Auth callback triggered. Checking session...");
        
        // Get the session directly - this should be populated after OAuth redirect
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          throw sessionError;
        }
        
        if (session) {
          console.log("Session found, user authenticated successfully");
          
          // Check if user exists in users table, create if not
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (userError && userError.code === 'PGRST116') {
            // User not found in table, create a profile
            console.log("Creating user profile in users table");
            await supabase
              .from('users')
              .insert([
                {
                  id: session.user.id,
                  email: session.user.email,
                  full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '',
                  role: 'customer'  // Default role
                }
              ]);
          }
          
          toast({
            title: "Authentication Successful",
            description: "You have been logged in successfully."
          });
          navigate('/dashboard');
        } else {
          console.log("No session found after OAuth redirect");
          // Check URL for errors from the OAuth provider
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const queryParams = new URLSearchParams(window.location.search);
          
          const error = queryParams.get('error') || hashParams.get('error');
          if (error) {
            console.error('OAuth error from URL:', error);
            const errorDescription = queryParams.get('error_description') || hashParams.get('error_description');
            
            throw new Error(errorDescription || 'Authentication failed');
          }
          
          // No error but no session either - redirect back to login
          navigate('/login');
        }
      } catch (error: any) {
        console.error('Error processing OAuth callback:', error);
        toast({
          title: "Authentication Failed",
          description: error.message || "There was an issue authenticating with Google. Please ensure Google authentication is enabled in your Supabase project.",
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
