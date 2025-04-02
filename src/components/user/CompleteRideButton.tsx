
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
  
  // First check if a pickup job already exists for this reservation
  const { data: existingJobs, isLoading } = useQuery({
    queryKey: ['existingPickupJobs', reservationId],
    queryFn: async () => {
      console.log("Checking for existing pickup jobs for reservation:", reservationId);
      const { data, error } = await supabase
        .from('delivery_jobs')
        .select('*')
        .eq('reservation_id', reservationId)
        .eq('job_type', 'pickup');
      
      if (error) {
        console.error("Error checking existing pickup jobs:", error);
        return [];
      }
      
      console.log("Existing pickup jobs:", data); // Debug log
      return data || [];
    }
  });
  
  const completeRideMutation = useMutation({
    mutationFn: async () => {
      try {
        // First update reservation status to "awaiting_pickup"
        const { error } = await supabase
          .from('reservations')
          .update({ status: 'awaiting_pickup' })
          .eq('id', reservationId);
          
        if (error) {
          console.error("Error updating reservation status:", error);
          throw new Error(error.message || "Failed to complete ride");
        }
        
        // Only create a pickup job if none exist
        if (!existingJobs || existingJobs.length === 0) {
          // Log that we're creating a new pickup job
          console.log("No existing pickup jobs found, creating a new one for reservation:", reservationId);
          
          // Explicitly create the pickup job to ensure it works regardless of RLS policies
          const { error: jobError } = await supabase
            .from('delivery_jobs')
            .insert([
              { 
                reservation_id: reservationId, 
                job_type: 'pickup', 
                status: 'available'
              }
            ]);
          
          if (jobError) {
            console.error("Error creating pickup job:", jobError);
            // If creating the pickup job fails, we'll still count the ride as complete
            // but log the error for troubleshooting
            console.warn("Ride marked as complete but pickup job creation failed:", jobError.message);
          }
        } else {
          console.log(`${existingJobs.length} pickup job(s) already exist, not creating a duplicate`);
        }
        
        return { success: true };
      } catch (error: any) {
        console.error("Complete ride operation failed:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userReservations'] });
      queryClient.invalidateQueries({ queryKey: ['existingPickupJobs'] });
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
      disabled={completeRideMutation.isPending || isLoading}
      variant="secondary"
      className="bg-green-600 hover:bg-green-700 text-white"
    >
      {completeRideMutation.isPending ? "Processing..." : "End Ride & Request Pickup"}
    </Button>
  );
};
