
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
  full_name?: string;
  phone_number?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  clearAllAuthData: () => Promise<void>;
  signup: (email: string, password: string, metadata?: Record<string, any>) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const clearAllAuthData = async (): Promise<void> => {
    try {
      // Force global signout to clear all sessions
      await supabase.auth.signOut({ scope: 'global' });
      
      // Clear all browser storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear cookies
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
      });
      
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

  const checkAdminStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error("Error fetching user role:", error);
        return 'customer';
      }
      
      return data?.role || 'customer';
    } catch (error) {
      console.error("Error in admin check:", error);
      return 'customer';
    }
  };

  const handleAuthChange = async (session: any) => {
    if (session?.user) {
      let userRole = 'customer';
      
      try {
        userRole = await checkAdminStatus(session.user.id);
        console.log("User role detected:", userRole);
      } catch (error) {
        console.error("Role detection error:", error);
      }
      
      setUser({
        id: session.user.id,
        email: session.user.email || '',
        name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '',
        photoUrl: session.user.user_metadata?.avatar_url,
        role: userRole,
        full_name: session.user.user_metadata?.full_name,
        phone_number: session.user.user_metadata?.phone_number
      });
      
      console.log("User authenticated:", session.user.id, "with role:", userRole);
      setIsLoading(false);
    } else {
      setUser(null);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log(`Auth state changed: ${event}`, session?.user?.id || 'No user');
        
        if (session) {
          handleAuthChange(session);
        } else {
          setUser(null);
          setIsLoading(false);
        }
      }
    );
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        handleAuthChange(session);
      } else {
        console.log("No existing session found");
        setIsLoading(false);
      }
    });
    
    return () => {
      subscription.unsubscribe();
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

  const logout = async () => {
    try {
      setIsLoading(true);
      
      // Use global scope to clear all sessions across all tabs and devices
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) throw error;
      
      // Explicitly clear all local storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear cookies
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
      });
      
      setUser(null);
      
      toast({
        title: "Logged Out",
        description: "You have been logged out successfully",
      });
      
      // Navigate to login page instead of home
      navigate('/login', { replace: true });
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

  const signup = async (email: string, password: string, metadata: Record<string, any> = {}) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      });
      
      if (error) throw error;
      
      if (data.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert([{ 
            id: data.user.id,
            email: data.user.email,
            full_name: metadata.full_name || '',
            phone_number: metadata.phone_number || '',
            role: metadata.role || 'customer'
          }]);
        
        if (profileError) throw profileError;
      }
      
      return { data, error: null };
    } catch (error: any) {
      console.error('Signup error:', error);
      return { data: null, error };
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      isAuthenticated: !!user, 
      loginWithGoogle, 
      logout,
      clearAllAuthData,
      signup
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
