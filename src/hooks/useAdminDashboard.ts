
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

export function useAdminDashboard() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const queryClient = useQueryClient();

  // Query to fetch all reservations with status filtering
  const { 
    data: reservations, 
    isLoading: isLoadingReservations,
    isError: isReservationsError,
    error: reservationsError
  } = useQuery({
    queryKey: ['admin', 'reservations', statusFilter],
    queryFn: async () => {
      console.log('Fetching admin reservations with filter:', statusFilter);
      
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
      
      if (error) {
        console.error('Error fetching reservations:', error);
        throw error;
      }
      
      console.log('Fetched reservations:', data);
      return data || [];
    },
    refetchOnWindowFocus: false
  });

  // Query to fetch pending reservations specifically
  const { 
    data: pendingReservations
  } = useQuery({
    queryKey: ['admin', 'pendingReservations'],
    queryFn: async () => {
      console.log('Fetching pending reservations');
      
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
        
      if (error) {
        console.error('Error fetching pending reservations:', error);
        throw error;
      }
      
      console.log('Fetched pending reservations:', data);
      return data || [];
    },
    refetchOnWindowFocus: false
  });

  // Query to fetch available boats
  const { 
    data: availableBoats, 
    isLoading: isLoadingBoats 
  } = useQuery({
    queryKey: ['admin', 'availableBoats'],
    queryFn: async () => {
      console.log('Fetching available boats');
      
      const { data, error } = await supabase
        .from('boats')
        .select('*')
        .eq('status', 'available');
        
      if (error) {
        console.error('Error fetching available boats:', error);
        throw error;
      }
      
      console.log('Fetched available boats:', data);
      return data || [];
    },
    refetchOnWindowFocus: false
  });

  // Mutation to assign boat to reservation
  const assignBoatMutation = useMutation({
    mutationFn: async ({ reservationId, boatId }: { reservationId: string, boatId: string }) => {
      console.log('Assigning boat', boatId, 'to reservation', reservationId);
      
      // First, update the boat status
      const { error: boatError } = await supabase
        .from('boats')
        .update({ status: 'reserved' })
        .eq('id', boatId);
        
      if (boatError) {
        console.error('Error updating boat status:', boatError);
        throw boatError;
      }
      
      // Then, update the reservation
      const { data, error } = await supabase
        .from('reservations')
        .update({ 
          boat_id: boatId, 
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', reservationId)
        .select();
        
      if (error) {
        console.error('Error updating reservation:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reservations'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'pendingReservations'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'availableBoats'] });
      
      toast({
        title: "Boat Assigned",
        description: "The reservation has been confirmed and a boat has been assigned."
      });
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

  // Mutation to update reservation status
  const updateReservationStatusMutation = useMutation({
    mutationFn: async ({ reservationId, newStatus }: { reservationId: string, newStatus: string }) => {
      console.log('Updating reservation', reservationId, 'status to', newStatus);
      
      const { data, error } = await supabase
        .from('reservations')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString(),
          ...(newStatus === 'in_progress' ? { start_time: new Date().toISOString() } : {}),
          ...(newStatus === 'completed' ? { end_time: new Date().toISOString() } : {})
        })
        .eq('id', reservationId)
        .select();
        
      if (error) {
        console.error('Error updating reservation status:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reservations'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'pendingReservations'] });
      
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

  return {
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
  };
}
