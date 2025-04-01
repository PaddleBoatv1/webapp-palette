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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSession = async () => {
      try {
        console.log("Checking for existing session...");
        
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
            if (error.code === 'PGRST116') {
              const { error: insertError } = await supabase
                .from('users')
                .insert([
                  {
                    id: session.user.id,
                    email: session.user.email,
                    full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '',
                    role: 'customer'
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
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loginWithGoogle = async () => {
    try {
      setIsLoading(true);
      console.log("Starting Google login flow");
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
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
      setIsLoading(false);
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
      
      if (data.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert([
            {
              id: data.user.id,
              email: data.user.email,
              full_name: name,
              role: 'customer'
            }
          ]);
          
        if (profileError) {
          console.error('Error creating user profile:', profileError);
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
