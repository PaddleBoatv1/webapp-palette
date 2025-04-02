
import React, { useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { MapPin, Calendar, Clock, LogOut, Ship, Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import UserTrips from "@/components/user/UserTrips";

const Dashboard = () => {
  const { user, logout } = useAuth();
  
  // Log the user role to debug
  useEffect(() => {
    if (user) {
      console.log("Dashboard - Current user:", user.email, "Role:", user.role);
    }
  }, [user]);
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-blue-600">PaddleRide</h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">
                Welcome, {user?.email || 'User'} 
                {user?.role === 'admin' && (
                  <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                    Admin
                  </span>
                )}
              </span>
              {user?.role === 'admin' && (
                <Link to="/admin">
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Admin Panel
                  </Button>
                </Link>
              )}
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Quick Book</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 mb-4">Book a paddleboat now or for later</p>
              <Link to="/create-reservation">
                <Button className="w-full">
                  <MapPin className="h-4 w-4 mr-2" />
                  Book Now
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Upcoming Trips</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 mb-4">View your scheduled paddleboat trips</p>
              <Button variant="outline" className="w-full">
                <Calendar className="h-4 w-4 mr-2" />
                View Calendar
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Trip History</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 mb-4">View your past paddleboat adventures</p>
              <Button variant="outline" className="w-full">
                <Clock className="h-4 w-4 mr-2" />
                View History
              </Button>
            </CardContent>
          </Card>
        </div>
        
        {user?.role === 'admin' && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-6">
            <h3 className="text-xl font-semibold text-amber-800 mb-2">Admin Tools</h3>
            <p className="text-amber-600 mb-4">Access the admin dashboard to manage bookings, boats, and more.</p>
            <div className="flex space-x-4">
              <Link to="/admin">
                <Button size="lg" className="bg-amber-600 hover:bg-amber-700">
                  <Settings className="h-5 w-5 mr-2" />
                  Admin Dashboard
                </Button>
              </Link>
            </div>
          </div>
        )}
        
        {/* User's trips section */}
        <UserTrips userId={user?.id} />
      </main>
    </div>
  );
};

export default Dashboard;
