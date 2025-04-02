
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
        navigate('/login', { replace: true });
      }, 1500);
      
      setProcessing(false);
      return;
    }

    const handleCallback = async () => {
      try {
        console.log("Processing authentication callback");
        
        // Check for existing session directly - simplify the flow
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }
        
        if (session) {
          console.log("Session found:", session.user.id);
          
          // Check if the user already exists in the database
          try {
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('id, role')
              .eq('id', session.user.id)
              .single();
              
            if (userError && userError.code !== 'PGRST116') {
              console.error("Error checking user existence:", userError);
            }
            
            // Check for liaison registration data in localStorage
            const liaisonData = localStorage.getItem('liaison_registration');
            
            if (liaisonData) {
              const { name, phone, termsAccepted } = JSON.parse(liaisonData);
              
              if (name && phone && termsAccepted) {
                // First, create or update the user profile
                const { error: profileError } = await supabase
                  .from('users')
                  .upsert({
                    id: session.user.id,
                    email: session.user.email,
                    full_name: name,
                    phone_number: phone,
                    role: 'liaison'
                  });
                  
                if (profileError) {
                  console.error("Error creating user profile:", profileError);
                  throw profileError;
                }
                
                // Then, create the liaison record
                const { error: liaisonError } = await supabase
                  .from('company_liaisons')
                  .upsert({
                    user_id: session.user.id,
                    is_active: true,
                    current_job_count: 0
                  });
                
                if (liaisonError) {
                  console.error("Error creating liaison record:", liaisonError);
                  throw liaisonError;
                }
                
                // Clear the temporary data
                localStorage.removeItem('liaison_registration');
                
                toast({
                  title: "Registration Successful",
                  description: "You have been registered as a delivery executive",
                });
                
                // Redirect to liaison dashboard
                navigate('/liaison', { replace: true });
                return;
              }
            } else if (!userData) {
              console.log("Creating new user profile");
              // Insert new user profile if it doesn't exist
              const { error: insertError } = await supabase
                .from('users')
                .insert([
                  { 
                    id: session.user.id, 
                    email: session.user.email,
                    full_name: session.user.user_metadata?.full_name || '',
                    role: 'customer' // Default role
                  }
                ]);
                
              if (insertError) {
                console.error("Error creating user profile:", insertError);
              }
            } else if (userData.role === 'admin') {
              console.log("User is an admin");
            }
          } catch (err) {
            console.error("User profile check/creation error:", err);
          }
          
          // Success message
          toast({
            title: "Authentication Successful",
            description: "You have been logged in successfully",
          });
          
          // Redirect to dashboard by default - role-based routing is handled at the route level
          navigate('/dashboard', { replace: true });
          return;
        }
        
        // No valid session could be established
        throw new Error("Authentication failed - no session found");
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
        localStorage.removeItem('liaison_registration');
        
        // Redirect to login
        setTimeout(() => {
          navigate('/login', { replace: true });
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
            localStorage.removeItem('liaison_registration');
            navigate('/login', { replace: true });
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
