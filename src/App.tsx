
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import AuthCallback from "./components/AuthCallback";
import { AuthProvider } from "./contexts/AuthContext";
import DatabaseSetup from "./components/DatabaseSetup";
import { useEffect } from "react";

const queryClient = new QueryClient();

// Component to handle access token redirects
const AccessTokenRedirect = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if there's an access token in the URL hash
    if (location.hash && location.hash.includes('access_token')) {
      console.log("Found access_token in hash, redirecting to auth callback");
      
      try {
        // Store the token in session storage to preserve it across redirects
        sessionStorage.setItem('auth_hash', location.hash);
        
        // Preserve the hash when redirecting
        navigate(`/auth/callback`, { replace: true });
      } catch (error) {
        console.error("Error handling OAuth redirect:", error);
        // If there's an error with session storage, try direct navigation
        navigate(`/auth/callback${location.hash}`, { replace: true });
      }
    }
  }, [location.hash, navigate]);
  
  return null;
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <div className="bg-black p-2 text-white text-center">
              <a href="/db-setup" className="hover:underline">
                Database Setup Page →
              </a>
            </div>
            
            <Routes>
              <Route path="/" element={<><AccessTokenRedirect /><Index /></>} />
              <Route path="/login" element={<><AccessTokenRedirect /><Login /></>} />
              <Route path="/signup" element={<><AccessTokenRedirect /><Signup /></>} />
              <Route path="/dashboard" element={<><AccessTokenRedirect /><Dashboard /></>} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/db-setup" element={<DatabaseSetup />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<><AccessTokenRedirect /><NotFound /></>} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
