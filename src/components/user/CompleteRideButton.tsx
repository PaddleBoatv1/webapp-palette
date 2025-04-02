
import React from 'react';
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface CompleteRideButtonProps {
  reservationId: string;
}

export const CompleteRideButton: React.FC<CompleteRideButtonProps> = ({ reservationId }) => {
  const queryClient = useQueryClient();
  
  const completeRideMutation = useMutation({
    mutationFn: async () => {
      // Update reservation status to "awaiting_pickup"
      const { error } = await supabase
        .from('reservations')
        .update({ status: 'awaiting_pickup' })
        .eq('id', reservationId);
        
      if (error) throw error;
      
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userReservations'] });
      toast({
        title: "Ride Completed",
        description: "Your ride has been completed and a pickup request has been sent.",
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
      {completeRideMutation.isPending ? "Processing..." : "Complete Ride"}
    </Button>
  );
};
