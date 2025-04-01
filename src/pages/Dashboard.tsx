
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { MapPin, Calendar, Clock, LogOut } from "lucide-react";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-blue-600">PaddleRide</h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Welcome, User</span>
              <Link to="/">
                <Button variant="outline" size="sm">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </Link>
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
              <Button className="w-full">
                <MapPin className="h-4 w-4 mr-2" />
                Book Now
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Upcoming Trips</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 mb-4">You have no upcoming trips</p>
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
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <h3 className="text-xl font-semibold text-blue-800 mb-2">Ready for an adventure?</h3>
          <p className="text-blue-600 mb-4">Book your first paddleboat experience and enjoy the water!</p>
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700">Start Booking</Button>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
