import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import CreateReservation from "./pages/CreateReservation";
import AdminDashboard from "./pages/AdminDashboard";
import LiaisonSignup from "./pages/LiaisonSignup";
import LiaisonDashboard from "./pages/LiaisonDashboard";
import NotFound from "./pages/NotFound";
import AuthCallback from "./components/AuthCallback";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import DatabaseSetup from "./components/DatabaseSetup";
import { useEffect } from "react";
import Navbar from "./components/navigation/Navbar";

const queryClient = new QueryClient();

// Protected route component - simplified
const ProtectedRoute = ({ element }: { element: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log("Not authenticated, redirecting to login");
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  return isAuthenticated ? <>{element}</> : null;
};

// Admin route - only for users with admin role
const AdminRoute = ({ element }: { element: React.ReactNode }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        console.log("Not authenticated, redirecting to login from admin route");
        navigate('/login', { replace: true });
      } else if (user?.role !== 'admin') {
        console.log("Not admin, redirecting to dashboard");
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, isLoading, navigate, user]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  return (isAuthenticated && user?.role === 'admin') ? <>{element}</> : null;
};

// Liaison route - only for users with liaison role
const LiaisonRoute = ({ element }: { element: React.ReactNode }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        console.log("Not authenticated, redirecting to login from liaison route");
        navigate('/login', { replace: true });
      } else if (user?.role !== 'liaison') {
        console.log("Not liaison, redirecting to dashboard");
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, isLoading, navigate, user]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  return (isAuthenticated && user?.role === 'liaison') ? <>{element}</> : null;
};

// Auth routes - redirect to dashboard if already logged in
const AuthRoute = ({ element }: { element: React.ReactNode }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      console.log("Already authenticated, redirecting to appropriate dashboard");
      if (user?.role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (user?.role === 'liaison') {
        navigate('/liaison', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, isLoading, navigate, user]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  return !isAuthenticated ? <>{element}</> : null;
};

// Modified routes configuration
const AppRoutes = () => {
  const { user } = useAuth();
  
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<AuthRoute element={<Login />} />} />
        <Route path="/signup" element={<AuthRoute element={<Signup />} />} />
        <Route path="/liaison-signup" element={<AuthRoute element={<LiaisonSignup />} />} />
        <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
        <Route path="/create-reservation" element={<ProtectedRoute element={<CreateReservation />} />} />
        <Route path="/admin" element={<AdminRoute element={<AdminDashboard />} />} />
        <Route path="/liaison" element={<LiaisonRoute element={<LiaisonDashboard />} />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/db-setup" element={<DatabaseSetup />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <div className="min-h-screen bg-gray-50 flex flex-col">
              <AppRoutes />
            </div>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
