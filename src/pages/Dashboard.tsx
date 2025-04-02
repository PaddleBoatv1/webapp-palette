
import React, { useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { MapPin, Calendar, Clock, Ship, Settings, Truck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import UserTrips from "@/components/user/UserTrips";

const Dashboard = () => {
  const { user } = useAuth();
  
  // Log the user role to debug
  useEffect(() => {
    if (user) {
      console.log("Dashboard - Current user:", user.email, "Role:", user.role);
    }
  }, [user]);
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content - Removed the header as we now have a global navbar */}
      <main className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
        
        {user?.role === 'customer' && (
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
        )}
        
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
        
        {user?.role === 'liaison' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h3 className="text-xl font-semibold text-green-800 mb-2">Delivery Executive Dashboard</h3>
            <p className="text-green-600 mb-4">Access your delivery dashboard to manage boat deliveries and pickups.</p>
            <div className="flex space-x-4">
              <Link to="/liaison">
                <Button size="lg" className="bg-green-600 hover:bg-green-700">
                  <Truck className="h-5 w-5 mr-2" />
                  Delivery Dashboard
                </Button>
              </Link>
            </div>
          </div>
        )}
        
        {/* User's trips section */}
        {user?.role === 'customer' && <UserTrips userId={user?.id} />}
        
        {user?.role === 'liaison' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Delivery & Pickup Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 mb-4">Manage your assignments and view available jobs</p>
                <Link to="/liaison">
                  <Button className="w-full">
                    <Ship className="h-4 w-4 mr-2" />
                    Open Dashboard
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
