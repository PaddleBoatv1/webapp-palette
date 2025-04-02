
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
  loginWithGoogle: () => Promise<void>;
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

  // Check if user is an admin - attempts to get from DB but uses fallback methods
  const checkAdminStatus = async (userId: string) => {
    try {
      // First try to get the role from the users table
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) {
        console.error("Error fetching user role:", error);
        return 'customer'; // Default to customer on error
      }
      
      return data?.role || 'customer';
    } catch (error) {
      console.error("Error in admin check:", error);
      return 'customer'; // Default to customer on error
    }
  };

  // Enhanced user session handler with better admin role detection
  const handleAuthChange = async (session: any) => {
    if (session?.user) {
      // Check if the user was created through the database admin page
      let userRole = 'customer';
      
      try {
        userRole = await checkAdminStatus(session.user.id);
        console.log("User role detected:", userRole);
      } catch (error) {
        console.error("Role detection error:", error);
      }
      
      // Set user info with the determined role
      setUser({
        id: session.user.id,
        email: session.user.email || '',
        name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '',
        photoUrl: session.user.user_metadata?.avatar_url,
        role: userRole // Set the role we determined
      });
      
      console.log("User authenticated:", session.user.id, "with role:", userRole);
      setIsLoading(false);
    } else {
      setUser(null);
      setIsLoading(false);
    }
  };

  // Set up auth state listener
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
    
    // Check for existing session on initial load
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
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      
      toast({
        title: "Logged Out",
        description: "You have been logged out successfully",
      });
      
      navigate('/', { replace: true });
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
      loginWithGoogle, 
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
