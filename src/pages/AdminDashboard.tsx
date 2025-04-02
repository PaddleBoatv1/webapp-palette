
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Ship, MapPin, LayoutDashboard, Filter } from "lucide-react";
import { format } from "date-fns";
import ZoneManager from "@/components/admin/ZoneManager";
import { parseCoordinates, formatCoordinate } from "@/lib/utils";

const AdminDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [assignBoatDialogOpen, setAssignBoatDialogOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [selectedBoatId, setSelectedBoatId] = useState<string>("");
  const [activeTab, setActiveTab] = useState("reservations");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Query to fetch all reservations with optional status filter
  const { data: reservations, isLoading: isLoadingReservations } = useQuery({
    queryKey: ['reservations', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('reservations')
        .select(`
          *,
          users(email, full_name),
          boats(*),
          start_zone:zones(id, zone_name),
          end_zone:zones(id, zone_name)
        `)
        .order('created_at', { ascending: false });
        
      // Apply status filter if not 'all'
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
        
      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  // Query to fetch pending reservations specifically (for quick access)
  const { data: pendingReservations } = useQuery({
    queryKey: ['pendingReservations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          users(email, full_name),
          start_zone:zones(id, zone_name),
          end_zone:zones(id, zone_name)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data;
    }
  });

  const { data: availableBoats, isLoading: isLoadingBoats } = useQuery({
    queryKey: ['availableBoats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('boats')
        .select('*')
        .eq('status', 'available');
        
      if (error) throw error;
      return data;
    }
  });

  const { data: zones, isLoading: isLoadingZones } = useQuery({
    queryKey: ['zones'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('zones')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data;
    }
  });

  const assignBoatMutation = useMutation({
    mutationFn: async ({ reservationId, boatId }: { reservationId: string, boatId: string }) => {
      const { error: boatError } = await supabase
        .from('boats')
        .update({ status: 'reserved' })
        .eq('id', boatId);
        
      if (boatError) throw boatError;
      
      const { data, error } = await supabase
        .from('reservations')
        .update({ 
          boat_id: boatId, 
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', reservationId)
        .select();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['pendingReservations'] });
      queryClient.invalidateQueries({ queryKey: ['availableBoats'] });
      
      toast({
        title: "Boat Assigned",
        description: "The reservation has been confirmed and a boat has been assigned."
      });
      
      setAssignBoatDialogOpen(false);
    },
    onError: (error) => {
      console.error('Error assigning boat:', error);
      toast({
        title: "Assignment Failed",
        description: "There was an error assigning the boat. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Update reservation status mutation
  const updateReservationStatusMutation = useMutation({
    mutationFn: async ({ reservationId, newStatus }: { reservationId: string, newStatus: string }) => {
      const { data, error } = await supabase
        .from('reservations')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', reservationId)
        .select();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['pendingReservations'] });
      
      toast({
        title: "Status Updated",
        description: "The reservation status has been successfully updated."
      });
    },
    onError: (error) => {
      console.error('Error updating status:', error);
      toast({
        title: "Update Failed",
        description: "There was an error updating the reservation status.",
        variant: "destructive"
      });
    }
  });

  const handleAssignBoat = (reservation: any) => {
    setSelectedReservation(reservation);
    setSelectedBoatId("");
    setAssignBoatDialogOpen(true);
  };

  const handleConfirmAssignment = () => {
    if (!selectedReservation || !selectedBoatId) {
      toast({
        title: "Missing Information",
        description: "Please select a boat to assign to this reservation.",
        variant: "destructive"
      });
      return;
    }
    
    assignBoatMutation.mutate({ 
      reservationId: selectedReservation.id,
      boatId: selectedBoatId
    });
  };

  const handleUpdateStatus = (reservationId: string, newStatus: string) => {
    updateReservationStatusMutation.mutate({
      reservationId,
      newStatus
    });
  };

  // Helper function to determine what actions are available based on current status
  const getStatusActions = (reservation: any) => {
    switch (reservation.status) {
      case 'pending':
        return (
          <Button 
            size="sm" 
            onClick={() => handleAssignBoat(reservation)}
            disabled={!availableBoats || availableBoats.length === 0}
          >
            Assign Boat
          </Button>
        );
      case 'confirmed':
        return (
          <Button 
            size="sm" 
            onClick={() => handleUpdateStatus(reservation.id, 'in_progress')}
          >
            Mark as Delivered
          </Button>
        );
      case 'in_progress':
        return (
          <Button 
            size="sm" 
            onClick={() => handleUpdateStatus(reservation.id, 'awaiting_pickup')}
          >
            Mark Return
          </Button>
        );
      case 'awaiting_pickup':
        return (
          <Button 
            size="sm" 
            onClick={() => handleUpdateStatus(reservation.id, 'completed')}
          >
            Complete Trip
          </Button>
        );
      case 'completed':
        return (
          <Badge variant="outline">Completed</Badge>
        );
      case 'canceled':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-800">Canceled</Badge>
        );
      default:
        return null;
    }
  };

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

  if (isLoadingReservations || isLoadingBoats) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-gray-500">Manage reservations, boats, and zones</p>
      </header>
      
      <Tabs defaultValue="reservations" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="reservations" className="flex items-center">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Reservations</span>
          </TabsTrigger>
          <TabsTrigger value="zones" className="flex items-center">
            <MapPin className="mr-2 h-4 w-4" />
            <span>Manage Zones</span>
          </TabsTrigger>
          <TabsTrigger value="boats" className="flex items-center">
            <Ship className="mr-2 h-4 w-4" />
            <span>Boats</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="reservations">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>All Reservations</CardTitle>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[180px]">
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
                <CardDescription>
                  View and manage all reservation requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reservations?.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No reservations found matching the selected filter
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Customer</TableHead>
                          <TableHead>Route</TableHead>
                          <TableHead>Start Time</TableHead>
                          <TableHead>Boat</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reservations?.map((reservation) => (
                          <TableRow key={reservation.id}>
                            <TableCell>
                              {reservation.users?.full_name || reservation.users?.email || 'Unknown'}
                            </TableCell>
                            <TableCell>
                              {reservation.start_zone?.zone_name || 'Not specified'} → {' '}
                              {reservation.end_zone?.zone_name || 'Not specified'}
                            </TableCell>
                            <TableCell>
                              {reservation.start_time ? 
                                format(new Date(reservation.start_time), 'PPp') : 
                                'Not scheduled'}
                            </TableCell>
                            <TableCell>
                              {reservation.boats?.boat_name || 'Not assigned'}
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusBadgeVariant(reservation.status)}>
                                {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {getStatusActions(reservation)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Pending Reservations</span>
                      <Badge variant="outline" className="ml-2">
                        {pendingReservations?.length || 0}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Review and assign boats to pending reservations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {pendingReservations?.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No pending reservations at this time
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Customer</TableHead>
                              <TableHead>Start Zone</TableHead>
                              <TableHead>End Zone</TableHead>
                              <TableHead>Start Time</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {pendingReservations?.map((reservation) => (
                              <TableRow key={reservation.id}>
                                <TableCell>
                                  {reservation.users?.full_name || reservation.users?.email || 'Unknown'}
                                </TableCell>
                                <TableCell>
                                  {reservation.start_zone?.zone_name || 'Not specified'}
                                </TableCell>
                                <TableCell>
                                  {reservation.end_zone?.zone_name || 'Not specified'}
                                </TableCell>
                                <TableCell>
                                  {reservation.start_time ? 
                                    format(new Date(reservation.start_time), 'PPp') : 
                                    'Not scheduled'}
                                </TableCell>
                                <TableCell>
                                  <Button 
                                    size="sm" 
                                    onClick={() => handleAssignBoat(reservation)}
                                    disabled={!availableBoats || availableBoats.length === 0}
                                  >
                                    Assign Boat
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              <div className="md:col-span-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Ship className="h-5 w-5 mr-2" />
                      <span>Available Boats</span>
                    </CardTitle>
                    <CardDescription>
                      Boats ready for assignment
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {availableBoats?.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">
                        No boats available
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {availableBoats?.map((boat) => (
                          <div 
                            key={boat.id} 
                            className="p-3 border rounded-md flex justify-between items-center"
                          >
                            <span>{boat.boat_name}</span>
                            <Badge variant="outline">Available</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="zones">
          <ZoneManager zones={zones || []} isLoading={isLoadingZones} />
        </TabsContent>
        
        <TabsContent value="boats">
          <Card>
            <CardHeader>
              <CardTitle>Boat Management</CardTitle>
              <CardDescription>
                View and manage your paddleboat inventory
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Boat
                </Button>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Boat Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>GPS Device ID</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {availableBoats?.map((boat) => (
                    <TableRow key={boat.id}>
                      <TableCell>{boat.boat_name}</TableCell>
                      <TableCell>
                        <Badge variant={boat.status === 'available' ? 'secondary' : 'outline'}>
                          {boat.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{boat.gps_device_id || 'Not assigned'}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">Edit</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Dialog open={assignBoatDialogOpen} onOpenChange={setAssignBoatDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Boat to Reservation</DialogTitle>
            <DialogDescription>
              Select an available boat to assign to this reservation.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Customer:</p>
              <p className="text-sm">
                {selectedReservation?.users?.full_name || 
                 selectedReservation?.users?.email || 
                 'Unknown'}
              </p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Route:</p>
              <p className="text-sm">
                {selectedReservation?.start_zone?.zone_name || 'Not specified'} → {' '}
                {selectedReservation?.end_zone?.zone_name || 'Not specified'}
              </p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Boat:</label>
              <Select value={selectedBoatId} onValueChange={setSelectedBoatId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a boat" />
                </SelectTrigger>
                <SelectContent>
                  {availableBoats?.map((boat) => (
                    <SelectItem key={boat.id} value={boat.id}>
                      {boat.boat_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setAssignBoatDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmAssignment}
              disabled={!selectedBoatId || assignBoatMutation.isPending}
            >
              {assignBoatMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                'Confirm Assignment'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
