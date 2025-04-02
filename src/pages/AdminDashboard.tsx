import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { 
  BarChart, PieChart, LineChart, CheckCircle, AlertCircle, 
  Clock, LogOut, Truck, User, Search, Plus, Ship, RefreshCw 
} from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import ZoneManager from "@/components/admin/ZoneManager";
import { useAdminDashboard } from '@/hooks/useAdminDashboard';
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatStatus, getStatusBadgeVariant } from '@/lib/utils';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { 
    boatStats, 
    reservationStats, 
    zoneStats,
    zones, 
    isLoadingZones,
    reservations,
    pendingReservations,
    allBoats,
    availableBoats,
    availableLiaisons,
    isLoadingLiaisons,
    isLoadingReservations,
    isLoadingBoats,
    assignBoatMutation,
    assignLiaisonMutation,
    updateReservationStatusMutation,
    addBoatMutation,
    updateBoatStatusMutation,
    statusFilter,
    setStatusFilter
  } = useAdminDashboard();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [newBoatName, setNewBoatName] = useState('');
  const [isAddBoatDialogOpen, setIsAddBoatDialogOpen] = useState(false);

  useEffect(() => {
    console.log("Admin Dashboard - Current user:", user);
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const assignBoat = (reservationId: string, boatId: string) => {
    assignBoatMutation.mutate({ reservationId, boatId });
  };

  const assignLiaison = (reservationId: string, liaisonId: string) => {
    assignLiaisonMutation.mutate({ reservationId, liaisonId });
  };

  const updateStatus = (reservationId: string, newStatus: string) => {
    updateReservationStatusMutation.mutate({ reservationId, newStatus });
  };

  const updateBoatStatus = (boatId: string, newStatus: string) => {
    updateBoatStatusMutation.mutate({ boatId, newStatus });
  };
  
  const handleAddBoat = () => {
    if (newBoatName.trim()) {
      addBoatMutation.mutate({ boat_name: newBoatName.trim() });
      setNewBoatName('');
      setIsAddBoatDialogOpen(false);
    }
  };

  const filteredReservations = reservations?.filter(reservation => {
    return (
      reservation.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.users?.[0]?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.users?.[0]?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="min-h-screen bg-gray-50">
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
        
        <Tabs defaultValue="reservations">
          <TabsList className="mb-6">
            <TabsTrigger value="reservations">
              <Clock className="h-4 w-4 mr-2" />
              Reservations
            </TabsTrigger>
            <TabsTrigger value="boats">
              <Ship className="h-4 w-4 mr-2" />
              Boat Management
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
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <CardTitle>Reservations</CardTitle>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-auto">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Search by ID or customer..." 
                        className="pl-8 w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Reservations</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="awaiting_pickup">Awaiting Pickup</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="canceled">Canceled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingReservations ? (
                  <div className="h-40 flex items-center justify-center">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                  </div>
                ) : filteredReservations && filteredReservations.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Booking ID</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>From/To</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredReservations.map((reservation: any) => (
                          <TableRow key={reservation.id}>
                            <TableCell className="font-medium">
                              {reservation.id.substring(0, 8)}
                            </TableCell>
                            <TableCell>
                              {reservation.users?.[0]?.full_name || 'Guest User'}
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusBadgeVariant(reservation.status)}>
                                {formatStatus(reservation.status)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {reservation.start_zone?.[0]?.zone_name || 'Unknown'} → {reservation.end_zone?.[0]?.zone_name || 'Unknown'}
                            </TableCell>
                            <TableCell>
                              {new Date(reservation.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Select onValueChange={(value) => updateStatus(reservation.id, value)}>
                                  <SelectTrigger className="h-8 w-24">
                                    <SelectValue placeholder="Status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectGroup>
                                      <SelectItem value="pending">Pending</SelectItem>
                                      <SelectItem value="confirmed">Confirmed</SelectItem>
                                      <SelectItem value="in_progress">In Progress</SelectItem>
                                      <SelectItem value="awaiting_pickup">Awaiting Pickup</SelectItem>
                                      <SelectItem value="completed">Completed</SelectItem>
                                      <SelectItem value="canceled">Canceled</SelectItem>
                                    </SelectGroup>
                                  </SelectContent>
                                </Select>

                                {reservation.status === 'pending' && (
                                  <Select onValueChange={(value) => assignBoat(reservation.id, value)}>
                                    <SelectTrigger className="h-8 w-24">
                                      <SelectValue placeholder="Boat" />
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
                                )}

                                {reservation.status === 'confirmed' && (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => assignLiaisonMutation.mutate({ 
                                      reservationId: reservation.id, 
                                      liaisonId: availableLiaisons?.[0]?.id 
                                    })}
                                  >
                                    <Truck className="h-4 w-4 mr-1" />
                                    Assign Delivery
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="h-40 flex flex-col items-center justify-center text-gray-500">
                    <AlertCircle className="h-8 w-8 mb-2 text-amber-500" />
                    <p>No reservations found</p>
                  </div>
                )}
              </CardContent>
            </Card>

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
                        
                        <div className="flex flex-col gap-3 mt-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2/3">
                              <Select onValueChange={(value) => assignBoat(reservation.id, value)}>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select a boat to confirm" />
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
                            
                            <div className="w-1/3">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-red-500 w-full border-red-300 hover:bg-red-50"
                                onClick={() => updateStatus(reservation.id, 'canceled')}
                              >
                                <AlertCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
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

          <TabsContent value="boats" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Boat Management</CardTitle>
                  <Dialog open={isAddBoatDialogOpen} onOpenChange={setIsAddBoatDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add New Boat
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Boat</DialogTitle>
                        <DialogDescription>
                          Enter the details for the new boat.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="boat-name">Boat Name</Label>
                          <Input 
                            id="boat-name" 
                            value={newBoatName} 
                            onChange={(e) => setNewBoatName(e.target.value)} 
                            placeholder="Enter boat name"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddBoatDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddBoat}>Add Boat</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingBoats ? (
                  <div className="h-40 flex items-center justify-center">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                  </div>
                ) : allBoats && allBoats.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Boat ID</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allBoats.map((boat: any) => (
                          <TableRow key={boat.id}>
                            <TableCell className="font-medium">{boat.id.substring(0, 8)}</TableCell>
                            <TableCell>{boat.boat_name}</TableCell>
                            <TableCell>
                              <Badge className={
                                boat.status === 'available' ? 'bg-green-100 text-green-800 hover:bg-green-200' :
                                boat.status === 'in_use' ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' :
                                boat.status === 'maintenance' ? 'bg-orange-100 text-orange-800 hover:bg-orange-200' :
                                'bg-gray-100 text-gray-800 hover:bg-gray-200'
                              }>
                                {boat.status.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Select onValueChange={(value) => updateBoatStatus(boat.id, value)}>
                                <SelectTrigger className="h-8 w-[120px]">
                                  <SelectValue placeholder="Change status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="available">Available</SelectItem>
                                  <SelectItem value="in_use">In Use</SelectItem>
                                  <SelectItem value="maintenance">Maintenance</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="h-40 flex flex-col items-center justify-center text-gray-500">
                    <AlertCircle className="h-8 w-8 mb-2 text-amber-500" />
                    <p>No boats found. Add your first boat.</p>
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
