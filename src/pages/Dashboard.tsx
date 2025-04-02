
import React, { useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { MapPin, Calendar, Clock, LogOut, Ship, Settings, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useGetUserReservations } from "@/hooks/useDatabase";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { data: userReservations, isLoading } = useGetUserReservations(user?.id);
  
  // Log the user role to debug
  useEffect(() => {
    if (user) {
      console.log("Dashboard - Current user:", user.email, "Role:", user.role);
    }
  }, [user]);
  
  const hasUpcomingReservations = userReservations?.some(
    (res: any) => res.status === 'confirmed' || res.status === 'pending'
  );

  // Helper function to get appropriate badge color for status
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return "bg-yellow-100 text-yellow-800";
      case 'confirmed':
        return "bg-blue-100 text-blue-800";
      case 'in_progress':
        return "bg-purple-100 text-purple-800";
      case 'awaiting_pickup':
        return "bg-orange-100 text-orange-800";
      case 'completed':
        return "bg-green-100 text-green-800";
      case 'canceled':
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  // Helper function to format status for display
  const formatStatus = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'confirmed':
        return 'Confirmed';
      case 'in_progress':
        return 'In Progress';
      case 'awaiting_pickup':
        return 'Awaiting Pickup';
      case 'completed':
        return 'Completed';
      case 'canceled':
        return 'Canceled';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };
  
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
              {isLoading ? (
                <p className="text-gray-500 mb-4">Loading your reservations...</p>
              ) : hasUpcomingReservations ? (
                <p className="text-gray-500 mb-4">You have upcoming paddleboat trips</p>
              ) : (
                <p className="text-gray-500 mb-4">You have no upcoming trips</p>
              )}
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
        
        {!userReservations || userReservations.length === 0 ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <h3 className="text-xl font-semibold text-blue-800 mb-2">Ready for an adventure?</h3>
            <p className="text-blue-600 mb-4">Book your first paddleboat experience and enjoy the water!</p>
            <Link to="/create-reservation">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">Start Booking</Button>
            </Link>
          </div>
        ) : (
          <div className="mt-8">
            <h3 className="text-xl font-bold mb-4">Your Reservations</h3>
            <div className="grid grid-cols-1 gap-4">
              {userReservations.map((reservation: any) => (
                <Card key={reservation.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      <div className="p-4 flex-grow">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center">
                              <Badge className={getStatusBadgeVariant(reservation.status)}>
                                {formatStatus(reservation.status)}
                              </Badge>
                              <p className="text-sm text-gray-500 ml-2">
                                {new Date(reservation.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            
                            <h4 className="font-medium text-lg mt-2">
                              {reservation.start_zone?.zone_name || 'Unknown'} → {reservation.end_zone?.zone_name || 'Unknown'}
                            </h4>
                            
                            <div className="mt-2 space-y-1">
                              <div className="flex items-center">
                                <Ship className="h-4 w-4 text-blue-500 mr-1" />
                                <span className="text-sm">
                                  Boat: {reservation.boats?.boat_name || 'Awaiting assignment'}
                                </span>
                              </div>
                              
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 text-blue-500 mr-1" />
                                <span className="text-sm">
                                  {reservation.start_time 
                                    ? `Start: ${format(new Date(reservation.start_time), 'PPp')}` 
                                    : 'Start time not scheduled'}
                                </span>
                              </div>
                              
                              {reservation.end_time && (
                                <div className="flex items-center">
                                  <Clock className="h-4 w-4 text-blue-500 mr-1" />
                                  <span className="text-sm">
                                    End: {format(new Date(reservation.end_time), 'PPp')}
                                  </span>
                                </div>
                              )}
                              
                              {reservation.final_cost && (
                                <div className="text-sm font-medium mt-2">
                                  Total Cost: ${parseFloat(reservation.final_cost).toFixed(2)}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="hidden md:flex items-center h-full">
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                      </div>
                      
                      {/* Status timeline for completed reservations */}
                      {reservation.status === 'completed' && (
                        <div className="bg-gray-50 p-4 border-t md:border-t-0 md:border-l border-gray-200 md:w-1/3">
                          <h5 className="font-medium text-sm mb-2">Trip Timeline</h5>
                          <div className="space-y-3">
                            <div className="flex items-start">
                              <div className="flex-shrink-0 h-4 w-4 rounded-full bg-green-500 mt-1"></div>
                              <div className="ml-2">
                                <p className="text-xs font-medium">Reservation Created</p>
                                <p className="text-xs text-gray-500">
                                  {format(new Date(reservation.created_at), 'PPp')}
                                </p>
                              </div>
                            </div>
                            {reservation.boats && (
                              <div className="flex items-start">
                                <div className="flex-shrink-0 h-4 w-4 rounded-full bg-blue-500 mt-1"></div>
                                <div className="ml-2">
                                  <p className="text-xs font-medium">Boat Assigned</p>
                                  <p className="text-xs text-gray-500">{reservation.boats.boat_name}</p>
                                </div>
                              </div>
                            )}
                            {reservation.start_time && (
                              <div className="flex items-start">
                                <div className="flex-shrink-0 h-4 w-4 rounded-full bg-purple-500 mt-1"></div>
                                <div className="ml-2">
                                  <p className="text-xs font-medium">Trip Started</p>
                                  <p className="text-xs text-gray-500">
                                    {format(new Date(reservation.start_time), 'PPp')}
                                  </p>
                                </div>
                              </div>
                            )}
                            {reservation.end_time && (
                              <div className="flex items-start">
                                <div className="flex-shrink-0 h-4 w-4 rounded-full bg-indigo-500 mt-1"></div>
                                <div className="ml-2">
                                  <p className="text-xs font-medium">Trip Ended</p>
                                  <p className="text-xs text-gray-500">
                                    {format(new Date(reservation.end_time), 'PPp')}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
