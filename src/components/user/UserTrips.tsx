
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Ship, Calendar, Clock, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { formatStatus, getStatusBadgeVariant } from "@/lib/utils";
import { useGetUserReservations } from "@/hooks/useDatabase";
import { Skeleton } from "@/components/ui/skeleton";

interface UserTripsProps {
  userId?: string;
}

const UserTrips: React.FC<UserTripsProps> = ({ userId }) => {
  const { data: userReservations, isLoading } = useGetUserReservations(userId);
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-bold mb-4">Your Reservations</h3>
        {[1, 2].map((i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="p-6">
                <Skeleton className="h-6 w-24 mb-4" />
                <Skeleton className="h-5 w-48 mb-2" />
                <div className="space-y-2 mt-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-36" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!userReservations || userReservations.length === 0) {
    return (
      <div className="mt-8">
        <h3 className="text-xl font-bold mb-4">Your Reservations</h3>
        <Card className="p-6 text-center">
          <p className="text-gray-500">You don't have any reservations yet.</p>
        </Card>
      </div>
    );
  }

  return (
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
                            Total Cost: ${parseFloat(String(reservation.final_cost)).toFixed(2)}
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
  );
};

export default UserTrips;
