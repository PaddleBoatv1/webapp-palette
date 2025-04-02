
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
import { Loader2, Plus, CalendarClock, Ship, MapPin, LayoutDashboard } from "lucide-react";
import { format } from "date-fns";
import ZoneManager from "@/components/admin/ZoneManager";

const AdminDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [assignBoatDialogOpen, setAssignBoatDialogOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [selectedBoatId, setSelectedBoatId] = useState<string>("");
  const [activeTab, setActiveTab] = useState("reservations");

  // Fetch pending reservations
  const { data: pendingReservations, isLoading: isLoadingReservations } = useQuery({
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

  // Fetch available boats
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

  // Fetch zones for zone management
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

  // Mutation to assign boat and update reservation status
  const assignBoatMutation = useMutation({
    mutationFn: async ({ reservationId, boatId }: { reservationId: string, boatId: string }) => {
      // First update the boat status
      const { error: boatError } = await supabase
        .from('boats')
        .update({ status: 'reserved' })
        .eq('id', boatId);
        
      if (boatError) throw boatError;
      
      // Then update the reservation
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

  // Function to open assign boat dialog
  const handleAssignBoat = (reservation: any) => {
    setSelectedReservation(reservation);
    setSelectedBoatId("");
    setAssignBoatDialogOpen(true);
  };

  // Function to submit boat assignment
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

  // Loading state
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
                        <Badge variant={boat.status === 'available' ? 'success' : 'secondary'}>
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
      
      {/* Assign Boat Dialog */}
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
