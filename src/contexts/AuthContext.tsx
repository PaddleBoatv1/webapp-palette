
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

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
  clearAllAuthData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Function to clear all auth data (useful for resetting state)
  const clearAllAuthData = async (): Promise<void> => {
    try {
      // Sign out from Supabase with global scope to clear all sessions
      await supabase.auth.signOut({ scope: 'global' });
      
      // Clear any stored data
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear cookies
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
      });
      
      // Clear in-memory state
      setUser(null);
      
      toast({
        title: "Auth Data Cleared",
        description: "All authentication data has been cleared",
      });
    } catch (error) {
      console.error("Error clearing auth data:", error);
      toast({
        title: "Error",
        description: "Failed to clear authentication data",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true);
        
        // Set up auth state change listener first
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log(`Auth state changed: ${event}`, session?.user?.id || 'No user');
            
            if (session?.user) {
              // Only use setTimeout for async operations to prevent potential auth deadlocks
              setTimeout(async () => {
                try {
                  const { data: userData, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();
                
                  if (error && error.code !== 'PGRST116') {
                    console.error("Error fetching user data:", error);
                    return;
                  }
                  
                  if (!userData) {
                    console.log("Creating new user profile");
                    const { error: insertError } = await supabase
                      .from('users')
                      .insert([{
                        id: session.user.id,
                        email: session.user.email,
                        full_name: session.user.user_metadata?.full_name || 
                                session.user.user_metadata?.name || 
                                session.user.email?.split('@')[0] || '',
                        role: 'customer'
                      }]);
                    
                    if (insertError) {
                      console.error("Error creating user profile:", insertError);
                    }
                  }
                  
                  // Update the user state with the session data
                  setUser({
                    id: session.user.id,
                    email: session.user.email || '',
                    name: userData?.full_name || 
                         session.user.user_metadata?.full_name || 
                         session.user.user_metadata?.name || 
                         session.user.email?.split('@')[0] || '',
                    photoUrl: session.user.user_metadata?.avatar_url,
                    role: userData?.role || 'customer'
                  });
                } catch (err) {
                  console.error("Error processing auth state change:", err);
                }
              }, 0);
            } else if (event === 'SIGNED_OUT') {
              setUser(null);
            }
          }
        );
        
        // Then check for existing session
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting session:", error);
          throw error;
        }
        
        if (data.session?.user) {
          console.log("Found existing session for user:", data.session.user.id);
          
          // Fetch user profile if session exists
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.session.user.id)
            .single();
          
          if (userError && userError.code !== 'PGRST116') {
            console.error("Error fetching user data:", userError);
          }
          
          setUser({
            id: data.session.user.id,
            email: data.session.user.email || '',
            name: userData?.full_name || 
                 data.session.user.user_metadata?.full_name || 
                 data.session.user.user_metadata?.name || 
                 data.session.user.email?.split('@')[0] || '',
            photoUrl: data.session.user.user_metadata?.avatar_url,
            role: userData?.role || 'customer'
          });
        } else {
          console.log("No existing session found");
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initialize();
    
    // Return cleanup function
    return () => {
      // Subscriptions are cleaned up automatically when component unmounts
    };
  }, []);

  const loginWithGoogle = async () => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        }
      });
      
      if (error) throw error;
    } catch (error: any) {
      console.error('Google login error:', error);
      toast({
        title: "Login Failed",
        description: error.message || "There was an issue logging in with Google",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      if (data.user) {
        toast({
          title: "Login Successful",
          description: "You have been logged in successfully",
        });
        
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: error.message || "Please check your credentials and try again",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      
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
      
      toast({
        title: "Signup Successful",
        description: "Your account has been created successfully",
      });
      
      // No need to manually set user state or create profile -
      // the onAuthStateChange handler will do this automatically
      
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Signup error:', error);
      toast({
        title: "Signup Failed",
        description: error.message || "There was an issue creating your account",
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
        description: "You have been logged out successfully",
      });
      
      navigate('/');
    } catch (error: any) {
      console.error('Logout error:', error);
      toast({
        title: "Logout Failed",
        description: error.message || "There was an issue logging you out",
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
      logout,
      clearAllAuthData
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
