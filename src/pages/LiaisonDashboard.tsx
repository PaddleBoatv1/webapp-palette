
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Clock, MapPin, User, Truck, ShieldCheck, AlertTriangle } from "lucide-react";
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLiaisonDashboard } from '@/hooks/useLiaisonDashboard';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

const LiaisonDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const {
    availableJobs,
    assignedJobs,
    isLoading,
    acceptJob,
    startDelivery,
    completeDelivery,
    startPickup,
    completePickup,
    resignJob,
    liaisonProfile,
  } = useLiaisonDashboard();
  const [jobInFocus, setJobInFocus] = useState<string | null>(null);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getStatusBadge = (status: string) => {
    if (status === 'assigned') {
      return <Badge variant="outline">Assigned</Badge>;
    } else if (status === 'in_progress') {
      return <Badge variant="secondary">In Progress</Badge>;
    } else if (status === 'completed') {
      return <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200">Completed</Badge>;
    } else if (status === 'cancelled') {
      return <Badge variant="destructive">Cancelled</Badge>;
    }
    return <Badge>Unknown</Badge>;
  };

  const getJobTypeIcon = (jobType: string) => {
    if (jobType === 'delivery') {
      return <Truck className="h-5 w-5 text-blue-500" />;
    } else if (jobType === 'pickup') {
      return <MapPin className="h-5 w-5 text-green-500" />;
    }
    return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-green-600">PaddleRide Delivery</h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">
                Welcome, {user?.name || user?.email || 'Executive'} 
                <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                  Delivery Executive
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
        <h2 className="text-2xl font-bold mb-6">Delivery Dashboard</h2>
        
        {/* Performance Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Today's Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{assignedJobs.length}</div>
              <p className="text-gray-500 mb-4">Assigned to you</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Available Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{availableJobs.length}</div>
              <p className="text-gray-500 mb-4">Ready to accept</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Executive Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold flex items-center text-green-600">
                <ShieldCheck className="h-5 w-5 mr-2" />
                Active
              </div>
              <p className="text-gray-500 mb-4">
                {liaisonProfile ? 
                  `Assigned: ${liaisonProfile.current_job_count}/${liaisonProfile.max_concurrent_jobs} jobs` : 
                  'Loading capacity...'}
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Job Management Tabs */}
        <Tabs defaultValue="assigned" className="mb-8">
          <TabsList className="mb-4">
            <TabsTrigger value="assigned">
              <Truck className="h-4 w-4 mr-2" />
              My Assignments ({assignedJobs.length})
            </TabsTrigger>
            <TabsTrigger value="available">
              <MapPin className="h-4 w-4 mr-2" />
              Available Jobs ({availableJobs.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="assigned">
            <div className="grid grid-cols-1 gap-4">
              {isLoading ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex justify-center">
                      <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                    </div>
                  </CardContent>
                </Card>
              ) : assignedJobs.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center text-gray-500">
                      <Clock className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                      <p>You don't have any assigned jobs at the moment.</p>
                      <p className="text-sm mt-2">Check available jobs to accept new assignments.</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                assignedJobs.map((job) => (
                  <Card key={job.id} className="relative border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center">
                          {getJobTypeIcon(job.jobType)}
                          <CardTitle className="text-lg ml-2">
                            {job.jobType === 'delivery' ? 'Boat Delivery' : 'Boat Pickup'}
                          </CardTitle>
                        </div>
                        {getStatusBadge(job.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-start">
                          <User className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                          <div>
                            <div className="font-medium">Customer</div>
                            <div className="text-sm text-gray-500">
                              {job.userName || 'Unknown Customer'}
                              <div>{job.userPhone || 'No phone provided'}</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-start">
                          <MapPin className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                          <div>
                            <div className="font-medium">
                              {job.jobType === 'delivery' ? 'Delivery Location' : 'Pickup Location'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {job.jobType === 'delivery' 
                                ? job.startZoneName || 'Unknown Zone'
                                : job.endZoneName || 'Unknown Zone'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end space-x-2 pt-0">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setJobInFocus(job.id)}>
                            Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{job.jobType === 'delivery' ? 'Boat Delivery Details' : 'Boat Pickup Details'}</DialogTitle>
                            <DialogDescription>
                              Assignment information and location details
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 mt-4">
                            <div className="space-y-2">
                              <h4 className="font-medium">Customer Information</h4>
                              <div className="text-sm">
                                <p><span className="font-medium">Name:</span> {job.userName || 'Unknown'}</p>
                                <p><span className="font-medium">Phone:</span> {job.userPhone || 'Not provided'}</p>
                                <p><span className="font-medium">Email:</span> {job.userEmail || 'Not provided'}</p>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <h4 className="font-medium">Location Information</h4>
                              <div className="text-sm">
                                <p><span className="font-medium">Start Zone:</span> {job.startZoneName || 'Unknown'}</p>
                                <p><span className="font-medium">End Zone:</span> {job.endZoneName || 'Unknown'}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-end space-x-2 mt-4">
                            <Button 
                              variant="outline"
                              size="sm"
                              onClick={() => resignJob(job.id)}
                            >
                              Resign Job
                            </Button>
                            {job.status === 'assigned' && job.jobType === 'delivery' && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => startDelivery(job.id)}
                              >
                                Start Delivery
                              </Button>
                            )}
                            {job.status === 'in_progress' && job.jobType === 'delivery' && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => completeDelivery(job.id)}
                              >
                                Complete Delivery
                              </Button>
                            )}
                            {job.status === 'assigned' && job.jobType === 'pickup' && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => startPickup(job.id)}
                              >
                                Start Pickup
                              </Button>
                            )}
                            {job.status === 'in_progress' && job.jobType === 'pickup' && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => completePickup(job.id)}
                              >
                                Complete Pickup
                              </Button>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      {job.status === 'assigned' && job.jobType === 'delivery' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => startDelivery(job.id)}
                        >
                          Start Delivery
                        </Button>
                      )}
                      {job.status === 'in_progress' && job.jobType === 'delivery' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => completeDelivery(job.id)}
                        >
                          Complete
                        </Button>
                      )}
                      {job.status === 'assigned' && job.jobType === 'pickup' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => startPickup(job.id)}
                        >
                          Start Pickup
                        </Button>
                      )}
                      {job.status === 'in_progress' && job.jobType === 'pickup' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => completePickup(job.id)}
                        >
                          Complete
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="available">
            <div className="grid grid-cols-1 gap-4">
              {isLoading ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex justify-center">
                      <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                    </div>
                  </CardContent>
                </Card>
              ) : availableJobs.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center text-gray-500">
                      <Clock className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                      <p>There are no available jobs at the moment.</p>
                      <p className="text-sm mt-2">Check back later for new assignments.</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                availableJobs.map((job) => (
                  <Card key={job.id} className="relative border-l-4 border-l-green-500">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center">
                          {getJobTypeIcon(job.jobType)}
                          <CardTitle className="text-lg ml-2">
                            {job.jobType === 'delivery' ? 'Boat Delivery' : 'Boat Pickup'}
                          </CardTitle>
                        </div>
                        <Badge variant="outline">Available</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-start">
                          <User className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                          <div>
                            <div className="font-medium">Customer</div>
                            <div className="text-sm text-gray-500">
                              {job.userName || 'Unknown Customer'}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-start">
                          <MapPin className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                          <div>
                            <div className="font-medium">
                              {job.jobType === 'delivery' ? 'Delivery Location' : 'Pickup Location'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {job.jobType === 'delivery' 
                                ? job.startZoneName || 'Unknown Zone'
                                : job.endZoneName || 'Unknown Zone'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end space-x-2 pt-0">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">Details</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{job.jobType === 'delivery' ? 'Boat Delivery Details' : 'Boat Pickup Details'}</DialogTitle>
                            <DialogDescription>
                              Assignment information and location details
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 mt-4">
                            <div className="space-y-2">
                              <h4 className="font-medium">Location Information</h4>
                              <div className="text-sm">
                                <p><span className="font-medium">Start Zone:</span> {job.startZoneName || 'Unknown'}</p>
                                <p><span className="font-medium">End Zone:</span> {job.endZoneName || 'Unknown'}</p>
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <Button 
                        variant="secondary"
                        size="sm"
                        onClick={() => acceptJob(job.id)}
                        disabled={liaisonProfile && liaisonProfile.current_job_count >= liaisonProfile.max_concurrent_jobs}
                      >
                        {liaisonProfile && liaisonProfile.current_job_count >= liaisonProfile.max_concurrent_jobs ? 
                          "At Capacity" : "Accept Job"}
                      </Button>
                    </CardFooter>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default LiaisonDashboard;
