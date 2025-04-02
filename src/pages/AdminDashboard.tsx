
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { BarChart, PieChart, LineChart, CheckCircle, AlertCircle, Clock, LogOut, Truck } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import ZoneManager from "@/components/admin/ZoneManager";
import { useAdminDashboard } from '@/hooks/useAdminDashboard';
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { 
    boatStats, 
    reservationStats, 
    zoneStats,
    zones, 
    isLoadingZones,
    pendingReservations,
    availableBoats,
    assignBoatMutation,
    updateReservationStatusMutation,
    isLoadingReservations
  } = useAdminDashboard();
  
  useEffect(() => {
    // Log user info for debugging
    console.log("Admin Dashboard - Current user:", user);
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const assignBoat = (reservationId: string, boatId: string) => {
    assignBoatMutation.mutate({ reservationId, boatId });
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-blue-600">PaddleRide Admin</h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">
                Welcome, {user?.name || user?.email || 'Admin'} 
                <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                  Administrator
                </span>
              </span>
              <Link to="/dashboard">
                <Button variant="outline" size="sm">
                  Dashboard
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Admin Dashboard</h2>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              Export Data
            </Button>
            <Button size="sm">
              System Settings
            </Button>
          </div>
        </div>

        {/* Dashboard Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Boats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{boatStats.total}</div>
              <p className="text-gray-500 text-sm">
                {boatStats.available} available | {boatStats.inUse} in use
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Current Reservations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{reservationStats.active}</div>
              <p className="text-gray-500 text-sm">
                {reservationStats.pending} pending | {reservationStats.completed} completed
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Popular Zones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{zoneStats.total}</div>
              <p className="text-gray-500 text-sm">
                Most popular: {zoneStats.popular}
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Tabs for different admin functions */}
        <Tabs defaultValue="reservations">
          <TabsList className="mb-6">
            <TabsTrigger value="reservations">
              <Clock className="h-4 w-4 mr-2" />
              Reservations
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="zones">
              <PieChart className="h-4 w-4 mr-2" />
              Zone Management
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="reservations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pending Reservations</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingReservations ? (
                  <div className="h-40 flex items-center justify-center">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                  </div>
                ) : pendingReservations && pendingReservations.length > 0 ? (
                  <div className="space-y-4">
                    {pendingReservations.map((reservation: any) => (
                      <Card key={reservation.id} className="p-4 border-l-4 border-l-amber-500">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold">
                              Reservation #{reservation.id.substring(0, 8)}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {reservation.users?.[0]?.full_name || 'Guest User'} - {new Date(reservation.created_at).toLocaleString()}
                            </p>
                          </div>
                          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                            Pending
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 my-3">
                          <div>
                            <p className="text-sm text-gray-600">From: <span className="font-medium">{reservation.start_zone?.[0]?.zone_name || 'Unknown'}</span></p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">To: <span className="font-medium">{reservation.end_zone?.[0]?.zone_name || 'Unspecified'}</span></p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-3">
                          <div className="w-1/2 pr-2">
                            <Select onValueChange={(value) => assignBoat(reservation.id, value)}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Assign a boat" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  {availableBoats && availableBoats.length > 0 ? (
                                    availableBoats.map((boat: any) => (
                                      <SelectItem key={boat.id} value={boat.id}>
                                        {boat.boat_name}
                                      </SelectItem>
                                    ))
                                  ) : (
                                    <SelectItem value="none" disabled>No boats available</SelectItem>
                                  )}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-red-500 border-red-300 hover:bg-red-50"
                              onClick={() => updateReservationStatusMutation.mutate({ 
                                reservationId: reservation.id, 
                                newStatus: 'canceled' 
                              })}
                            >
                              <AlertCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="h-40 flex flex-col items-center justify-center text-gray-500">
                    <CheckCircle className="h-8 w-8 mb-2 text-green-500" />
                    <p>No pending reservations to handle</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 bg-gray-100 rounded flex items-center justify-center">
                  <p className="text-gray-500">Revenue chart will be displayed here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="zones" className="space-y-4">
            <ZoneManager zones={zones || []} isLoading={isLoadingZones} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
