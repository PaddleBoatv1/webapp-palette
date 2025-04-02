import React, { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
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
import { Loader2, Plus, Ship, MapPin, LayoutDashboard, Filter, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import ZoneManager from "@/components/admin/ZoneManager";
import { formatStatus, getStatusBadgeVariant } from "@/lib/utils";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";

const AdminDashboard = () => {
  const { toast } = useToast();
  const [assignBoatDialogOpen, setAssignBoatDialogOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [selectedBoatId, setSelectedBoatId] = useState<string>("");
  const [activeTab, setActiveTab] = useState("reservations");
  
  const {
    reservations,
    pendingReservations,
    availableBoats,
    isLoadingReservations,
    isLoadingBoats,
    isReservationsError,
    reservationsError,
    statusFilter,
    setStatusFilter,
    assignBoatMutation,
    updateReservationStatusMutation
  } = useAdminDashboard();

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

  const getUserName = (reservation: any) => {
    if (!reservation.users) return 'Unknown';
    const userData = Array.isArray(reservation.users) ? reservation.users[0] : reservation.users;
    return userData?.full_name || userData?.email || 'Unknown';
  };

  const getZoneName = (zone: any) => {
    if (!zone) return 'Not specified';
    const zoneData = Array.isArray(zone) ? zone[0] : zone;
    return zoneData?.zone_name || 'Not specified';
  };

  const getBoatName = (boat: any) => {
    if (!boat) return 'Not assigned';
    const boatData = Array.isArray(boat) ? boat[0] : boat;
    return boatData?.boat_name || 'Not assigned';
  };

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
            variant="secondary"
            onClick={() => handleUpdateStatus(reservation.id, 'awaiting_pickup')}
          >
            Mark for Return
          </Button>
        );
      case 'awaiting_pickup':
        return (
          <Button 
            size="sm" 
            variant="success"
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
                {isReservationsError ? (
                  <div className="bg-red-50 text-red-700 p-4 rounded-md flex items-center mb-4">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    <div>
                      <h4 className="font-medium">Error loading reservations</h4>
                      <p className="text-sm">{reservationsError?.message || "Please try again later"}</p>
                    </div>
                  </div>
                ) : reservations?.length === 0 ? (
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
                              {getUserName(reservation)}
                            </TableCell>
                            <TableCell>
                              {getZoneName(reservation.start_zone)} → {' '}
                              {getZoneName(reservation.end_zone)}
                            </TableCell>
                            <TableCell>
                              {reservation.start_time ? 
                                format(new Date(reservation.start_time), 'PPp') : 
                                'Not scheduled'}
                            </TableCell>
                            <TableCell>
                              {getBoatName(reservation.boats)}
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusBadgeVariant(reservation.status)}>
                                {formatStatus(reservation.status)}
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
                              <TableHead>Created</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {pendingReservations?.map((reservation) => (
                              <TableRow key={reservation.id}>
                                <TableCell>
                                  {getUserName(reservation)}
                                </TableCell>
                                <TableCell>
                                  {getZoneName(reservation.start_zone)}
                                </TableCell>
                                <TableCell>
                                  {getZoneName(reservation.end_zone)}
                                </TableCell>
                                <TableCell>
                                  {reservation.created_at ? 
                                    format(new Date(reservation.created_at), 'PPp') : 
                                    'Unknown'}
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
          <Card>
            <CardContent className="pt-6">
              <ZoneManager zones={[]} isLoading={false} />
            </CardContent>
          </Card>
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
                {selectedReservation ? getUserName(selectedReservation) : 'Unknown'}
              </p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Route:</p>
              <p className="text-sm">
                {selectedReservation ? getZoneName(selectedReservation.start_zone) : 'Not specified'} → {' '}
                {selectedReservation ? getZoneName(selectedReservation.end_zone) : 'Not specified'}
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
