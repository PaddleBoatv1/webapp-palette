
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the authorization code from the URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        if (!code) {
          throw new Error('Authorization code not found');
        }
        
        // In a real implementation, you would send this code to your backend
        // to exchange it for tokens and user information
        console.log('Received authorization code:', code);
        
        // For demo purposes, simulate a successful authentication
        // with a mock user
        const mockUser = {
          id: 'google-user-' + Math.random().toString(36).substring(2, 9),
          email: 'user@example.com',
          name: 'Google User',
          photoUrl: 'https://via.placeholder.com/150',
        };
        
        // Store user in localStorage
        localStorage.setItem('user', JSON.stringify(mockUser));
        
        toast({
          title: "Google Login Successful",
          description: "You have been logged in with Google successfully.",
        });
        
        // Redirect to dashboard
        navigate('/dashboard');
      } catch (error) {
        console.error('Error processing OAuth callback:', error);
        toast({
          title: "Authentication Failed",
          description: "There was an issue authenticating with Google.",
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
      </div>
    </div>
  );
};

export default AuthCallback;
