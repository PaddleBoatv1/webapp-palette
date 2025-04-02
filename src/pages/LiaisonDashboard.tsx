
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLiaisonDashboard } from '@/hooks/useLiaisonDashboard';
import { formatStatus, getStatusBadgeVariant } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from '@/components/ui/table';
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
import { Loader2, Ship, MapPin, Phone, Mail, Navigation, CheckCircle, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const LiaisonDashboard = () => {
  const { user } = useAuth();
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [jobDetailsOpen, setJobDetailsOpen] = useState(false);
  
  const {
    liaisonData,
    availableJobs,
    assignedJobs,
    isLoadingAvailableJobs,
    isLoadingAssignedJobs,
    filterStatus,
    setFilterStatus,
    acceptJobMutation,
    updateJobStatusMutation
  } = useLiaisonDashboard(user?.id);

  const handleAcceptJob = (job: any) => {
    acceptJobMutation.mutate(job.id);
  };

  const openJobDetails = (job: any) => {
    setSelectedJob(job);
    setJobDetailsOpen(true);
  };

  const handleUpdateStatus = (jobId: string, newStatus: string) => {
    let reservationUpdate = null;
    
    // Determine if we need to update the reservation status as well
    if (selectedJob) {
      if (newStatus === 'in_progress' && selectedJob.job_type === 'delivery') {
        // When starting a delivery, update reservation to in_progress
        reservationUpdate = {
          id: selectedJob.reservation.id,
          status: 'in_progress'
        };
      } else if (newStatus === 'completed' && selectedJob.job_type === 'pickup') {
        // When completing a pickup, update reservation to completed
        reservationUpdate = {
          id: selectedJob.reservation.id,
          status: 'completed'
        };
      }
    }
    
    updateJobStatusMutation.mutate({ 
      jobId, 
      newStatus,
      reservationUpdate 
    });
    
    setJobDetailsOpen(false);
  };
  
  const formatJobType = (type: string): string => {
    return type === 'delivery' ? 'Boat Delivery' : 'Boat Pickup';
  };
  
  const getJobStatusBadgeVariant = (status: string): string => {
    switch (status) {
      case 'available':
        return 'bg-blue-100 text-blue-800';
      case 'assigned':
        return 'bg-purple-100 text-purple-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionsForJobStatus = (job: any) => {
    switch (job.status) {
      case 'assigned':
        return (
          <Button size="sm" onClick={() => handleUpdateStatus(job.id, 'in_progress')}>
            Start {job.job_type === 'delivery' ? 'Delivery' : 'Pickup'}
          </Button>
        );
      case 'in_progress':
        return (
          <Button size="sm" variant="success" onClick={() => handleUpdateStatus(job.id, 'completed')}>
            Complete {job.job_type === 'delivery' ? 'Delivery' : 'Pickup'}
          </Button>
        );
      case 'completed':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-800">
            Completed
          </Badge>
        );
      default:
        return null;
    }
  };

  if (isLoadingAvailableJobs || isLoadingAssignedJobs) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Delivery Executive Dashboard</h1>
            <p className="text-gray-500">Manage your boat deliveries and pickups</p>
          </div>
          <div>
            <div className="text-right">
              <p className="font-semibold">{user?.full_name || user?.email}</p>
              <Badge variant="outline" className="mt-1">
                Delivery Executive
              </Badge>
            </div>
            <div className="mt-2 text-right">
              <Badge variant={liaisonData?.is_active ? "success" : "destructive"}>
                {liaisonData?.is_active ? 'Active' : 'Inactive'}
              </Badge>
              <Badge variant="outline" className="ml-2">
                Jobs: {liaisonData?.current_job_count || 0}/{liaisonData?.max_concurrent_jobs || 3}
              </Badge>
            </div>
          </div>
        </div>
      </header>
      
      <Tabs defaultValue="assigned">
        <TabsList className="mb-6">
          <TabsTrigger value="assigned" className="flex items-center">
            <Ship className="mr-2 h-4 w-4" />
            <span>My Assignments</span>
          </TabsTrigger>
          <TabsTrigger value="available" className="flex items-center">
            <MapPin className="mr-2 h-4 w-4" />
            <span>Available Jobs</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="assigned">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>My Assignments</CardTitle>
                <div className="flex items-center gap-2">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Jobs</SelectItem>
                      <SelectItem value="assigned">Assigned</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <CardDescription>
                View and manage your assigned deliveries and pickups
              </CardDescription>
            </CardHeader>
            <CardContent>
              {assignedJobs?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  You don't have any {filterStatus !== 'all' ? filterStatus : ''} jobs assigned at this time.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Assigned</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignedJobs?.map((job) => (
                        <TableRow key={job.id} className="cursor-pointer hover:bg-gray-50" onClick={() => openJobDetails(job)}>
                          <TableCell>
                            <Badge variant={job.job_type === 'delivery' ? "secondary" : "outline"}>
                              {formatJobType(job.job_type)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {job.reservation?.users?.full_name || job.reservation?.users?.email || 'Unknown'}
                          </TableCell>
                          <TableCell>
                            {job.job_type === 'delivery' 
                              ? job.reservation?.start_zone?.zone_name 
                              : job.reservation?.end_zone?.zone_name || 'Unknown'}
                          </TableCell>
                          <TableCell>
                            {job.assigned_at 
                              ? format(new Date(job.assigned_at), 'PPp') 
                              : 'Unknown'}
                          </TableCell>
                          <TableCell>
                            <Badge className={getJobStatusBadgeVariant(job.status)}>
                              {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {getActionsForJobStatus(job)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="available">
          <Card>
            <CardHeader>
              <CardTitle>Available Jobs</CardTitle>
              <CardDescription>
                Pick up new delivery or pickup assignments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {availableJobs?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  There are no available jobs at this time.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {availableJobs?.map((job) => (
                    <Card key={job.id} className="overflow-hidden">
                      <div className={`px-4 py-2 ${job.job_type === 'delivery' ? 'bg-blue-50' : 'bg-orange-50'}`}>
                        <Badge variant={job.job_type === 'delivery' ? "secondary" : "outline"}>
                          {formatJobType(job.job_type)}
                        </Badge>
                      </div>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center text-sm">
                            <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                            {format(new Date(job.created_at), 'PPp')}
                          </div>
                          <div className="flex items-center text-sm">
                            <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                            {job.job_type === 'delivery' 
                              ? job.reservation?.start_zone?.zone_name 
                              : job.reservation?.end_zone?.zone_name || 'Unknown'}
                          </div>
                          <div className="flex items-center text-sm">
                            <Mail className="h-4 w-4 mr-2 text-gray-500" />
                            {job.reservation?.users?.email || 'Unknown'}
                          </div>
                          <div className="mt-4">
                            <Button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAcceptJob(job);
                              }}
                              disabled={acceptJobMutation.isPending || liaisonData?.current_job_count >= liaisonData?.max_concurrent_jobs}
                              className="w-full"
                            >
                              {acceptJobMutation.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Accepting...
                                </>
                              ) : (
                                <>Accept Job</>
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Job Details Dialog */}
      {selectedJob && (
        <Dialog open={jobDetailsOpen} onOpenChange={setJobDetailsOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                <div className="flex items-center">
                  <Ship className="h-5 w-5 mr-2 text-blue-500" />
                  {formatJobType(selectedJob.job_type)} Details
                </div>
              </DialogTitle>
              <DialogDescription>
                View all details and manage this job
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="flex justify-between">
                <Badge className={getJobStatusBadgeVariant(selectedJob.status)}>
                  {selectedJob.status.charAt(0).toUpperCase() + selectedJob.status.slice(1)}
                </Badge>
                <Badge variant="outline">
                  {format(new Date(selectedJob.created_at), 'PP')}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Customer Information</h4>
                <div className="flex items-center text-sm">
                  <CheckCircle className="h-4 w-4 mr-2 text-gray-500" />
                  {selectedJob.reservation?.users?.full_name || 'No name provided'}
                </div>
                <div className="flex items-center text-sm">
                  <Mail className="h-4 w-4 mr-2 text-gray-500" />
                  {selectedJob.reservation?.users?.email || 'No email provided'}
                </div>
                <div className="flex items-center text-sm">
                  <Phone className="h-4 w-4 mr-2 text-gray-500" />
                  {selectedJob.reservation?.users?.phone_number || 'No phone provided'}
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Location</h4>
                <div className="flex items-center text-sm">
                  <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="font-medium mr-1">
                    {selectedJob.job_type === 'delivery' ? 'Delivery to:' : 'Pickup from:'}
                  </span>
                  {selectedJob.job_type === 'delivery' 
                    ? selectedJob.reservation?.start_zone?.zone_name 
                    : selectedJob.reservation?.end_zone?.zone_name || 'Unknown'}
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full mt-2"
                  onClick={() => {
                    // Open in Google Maps - using coordinates if available, otherwise use zone name
                    const zone = selectedJob.job_type === 'delivery' 
                      ? selectedJob.reservation?.start_zone
                      : selectedJob.reservation?.end_zone;
                      
                    let mapsUrl;
                    if (zone?.coordinates) {
                      const coords = typeof zone.coordinates === 'string' 
                        ? JSON.parse(zone.coordinates) 
                        : zone.coordinates;
                      
                      if (coords.lat && coords.lng) {
                        mapsUrl = `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`;
                      } else {
                        mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(zone.zone_name)}`;
                      }
                    } else {
                      mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(zone?.zone_name || '')}`;
                    }
                    
                    window.open(mapsUrl, '_blank');
                  }}
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  Navigate to Location
                </Button>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Reservation Status</h4>
                <Badge className={getStatusBadgeVariant(selectedJob.reservation?.status || 'unknown')}>
                  {formatStatus(selectedJob.reservation?.status || 'unknown')}
                </Badge>
              </div>
            </div>
            
            <DialogFooter>
              {getActionsForJobStatus(selectedJob)}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default LiaisonDashboard;
