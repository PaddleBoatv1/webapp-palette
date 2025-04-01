
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

// Define the user type
interface User {
  id: string;
  email: string;
  name: string;
  photoUrl?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Check for existing session on load
  useEffect(() => {
    const fetchSession = async () => {
      try {
        setIsLoading(true);
        console.log("Checking for existing session...");
        
        // Check if user has an active session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          console.log("Found existing session for user:", session.user.id);
          const { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (error) {
            console.error("Error fetching user data:", error);
            throw error;
          }
          
          // Convert the Supabase user to our User format
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: userData?.full_name || session.user.email?.split('@')[0] || '',
            photoUrl: session.user.user_metadata?.avatar_url,
            role: userData?.role
          });
          console.log("User set from existing session");
        } else {
          console.log("No existing session found");
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSession();
    
    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session ? session.user.id : 'No user');
      
      if (event === 'SIGNED_IN' && session) {
        try {
          setIsLoading(true);
          const { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (!error && userData) {
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              name: userData?.full_name || session.user.email?.split('@')[0] || '',
              photoUrl: session.user.user_metadata?.avatar_url,
              role: userData?.role
            });
            console.log("User data fetched successfully after sign in");
          } else if (error) {
            console.log("User not found in users table, creating one", error);
            // If user not found in the users table, create one
            if (error.code === 'PGRST116') {
              const { error: insertError } = await supabase
                .from('users')
                .insert([
                  {
                    id: session.user.id,
                    email: session.user.email,
                    full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '',
                    role: 'customer'  // Default role
                  }
                ]);
              
              if (!insertError) {
                console.log("Created new user record in users table");
                setUser({
                  id: session.user.id,
                  email: session.user.email || '',
                  name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '',
                  photoUrl: session.user.user_metadata?.avatar_url,
                  role: 'customer'
                });
              } else {
                console.error("Error creating user record:", insertError);
              }
            }
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        } finally {
          setIsLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        console.log("User signed out");
        setUser(null);
      }
    });
    
    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loginWithGoogle = async () => {
    try {
      setIsLoading(true);
      console.log("Starting Google login flow");
      
      // Determine if we're in a production environment based on the hostname
      const isProduction = 
        window.location.hostname !== 'localhost' && 
        window.location.hostname !== '127.0.0.1';
      
      // Get the current origin for proper redirect
      const origin = isProduction
        ? window.location.origin // Use the current hostname in production
        : 'http://localhost:3000'; // Fallback to localhost for development
      
      console.log("Detected environment:", isProduction ? "production" : "development");
      console.log("Using origin for redirect:", origin);
      
      // Use the exact URL based on the current origin for callback
      const redirectUrl = `${origin}/auth/callback`;
      console.log("Using redirect URL:", redirectUrl);
      
      // Use the correct method for Google OAuth sign-in
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });
      
      if (error) {
        console.error("Google sign-in error:", error);
        throw error;
      }
      
      console.log("Google sign-in initiated, waiting for redirect");
      // Don't reset isLoading here as we're redirecting to Google
      
    } catch (error: any) {
      console.error('Google login error:', error);
      toast({
        title: "Login Failed",
        description: error.message || "There was an issue logging in with Google.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      console.log("Attempting email/password login");
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error("Login error:", error);
        throw error;
      }
      
      if (data.user) {
        console.log("Login successful for user:", data.user.id);
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();
          
        if (!userError && userData) {
          setUser({
            id: data.user.id,
            email: data.user.email || '',
            name: userData.full_name || data.user.email?.split('@')[0] || '',
            role: userData.role
          });
          console.log("User data fetched successfully");
        } else {
          console.log("User data not found, using basic data");
        }
        
        toast({
          title: "Login Successful",
          description: "You have been logged in successfully.",
        });
        
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
      throw error; // Rethrow to handle in the component
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      
      // Create user with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name
          }
        }
      });
      
      if (error) throw error;
      
      if (data.user) {
        // Create user profile in users table
        const { error: profileError } = await supabase
          .from('users')
          .insert([
            {
              id: data.user.id,
              email: data.user.email,
              full_name: name,
              role: 'customer'  // Default role
            }
          ]);
          
        if (profileError) {
          console.error('Error creating user profile:', profileError);
          // Continue anyway, since the auth record was created
        }
        
        setUser({
          id: data.user.id,
          email: data.user.email || '',
          name: name,
          role: 'customer'
        });
        
        toast({
          title: "Account Created",
          description: "Your account has been created successfully.",
        });
        
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      toast({
        title: "Signup Failed",
        description: error.message || "There was an issue creating your account.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      
      toast({
        title: "Logged Out",
        description: "You have been logged out successfully.",
      });
      
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logout Failed",
        description: "There was an issue logging you out.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      isAuthenticated: !!user, 
      login, 
      loginWithGoogle, 
      signup, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
