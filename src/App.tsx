
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import AuthCallback from "./components/AuthCallback";
import { AuthProvider } from "./contexts/AuthContext";
import DatabaseSetup from "./components/DatabaseSetup";

const queryClient = new QueryClient();

// Component to handle access token redirects
const AccessTokenRedirect = () => {
  const location = useLocation();
  
  // If URL has access_token in hash, navigate to auth callback
  if (location.hash && location.hash.includes('access_token')) {
    return <Navigate to="/auth/callback" replace />;
  }
  
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
              <Link to="/db-setup" className="hover:underline">
                Database Setup Page →
              </Link>
            </div>
            
            <Routes>
              <Route path="/" element={<><AccessTokenRedirect /><Index /></>} />
              <Route path="/login" element={<><AccessTokenRedirect /><Login /></>} />
              <Route path="/signup" element={<><AccessTokenRedirect /><Signup /></>} />
              <Route path="/dashboard" element={<><AccessTokenRedirect /><Dashboard /></>} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/*" element={<AccessTokenRedirect />} /> {/* Catch-all for token redirects */}
              <Route path="/db-setup" element={<DatabaseSetup />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
