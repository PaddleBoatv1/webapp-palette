
import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { BarChart, PieChart, LineChart } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import ZoneManager from "@/components/admin/ZoneManager";
import { useAdminDashboard } from '@/hooks/useAdminDashboard';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { 
    boatStats, 
    reservationStats, 
    zoneStats, 
    zones, 
    isLoadingZones 
  } = useAdminDashboard();
  
  useEffect(() => {
    // Log user info for debugging
    console.log("Admin Dashboard - Current user:", user);
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
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
        <Tabs defaultValue="analytics">
          <TabsList className="mb-6">
            <TabsTrigger value="analytics">
              <BarChart className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="zones">
              <PieChart className="h-4 w-4 mr-2" />
              Zone Management
            </TabsTrigger>
            <TabsTrigger value="reservations">
              <LineChart className="h-4 w-4 mr-2" />
              Reservations
            </TabsTrigger>
          </TabsList>
          
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
          
          <TabsContent value="reservations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Reservations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 bg-gray-100 rounded flex items-center justify-center">
                  <p className="text-gray-500">Reservation list will be displayed here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
