
import React from 'react';
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface CompleteRideButtonProps {
  reservationId: string;
}

export const CompleteRideButton: React.FC<CompleteRideButtonProps> = ({ reservationId }) => {
  const queryClient = useQueryClient();
  
  // We no longer need to check for existing pickup jobs since we'll rely on the trigger
  const completeRideMutation = useMutation({
    mutationFn: async () => {
      try {
        console.log("Completing ride for reservation:", reservationId);
        
        // Update reservation status to "awaiting_pickup"
        // This will trigger the database function to create a pickup job
        const { error } = await supabase
          .from('reservations')
          .update({ status: 'awaiting_pickup' })
          .eq('id', reservationId);
          
        if (error) {
          console.error("Error updating reservation status:", error);
          throw new Error(error.message || "Failed to complete ride");
        }
        
        // The database trigger will handle creating the pickup job
        console.log("Ride completed. Database trigger will create pickup job.");
        
        return { success: true };
      } catch (error: any) {
        console.error("Complete ride operation failed:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userReservations'] });
      toast({
        title: "Ride Completed",
        description: "Your ride has been completed and a pickup request has been sent. Please wait at the designated zone for a liaison to collect the boat.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to complete the ride",
        variant: "destructive",
      });
    },
  });

  const handleCompleteRide = () => {
    completeRideMutation.mutate();
  };

  return (
    <Button 
      onClick={handleCompleteRide} 
      disabled={completeRideMutation.isPending}
      variant="secondary"
      className="bg-green-600 hover:bg-green-700 text-white"
    >
      {completeRideMutation.isPending ? "Processing..." : "End Ride & Request Pickup"}
    </Button>
  );
};
