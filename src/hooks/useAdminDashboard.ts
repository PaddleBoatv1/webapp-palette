
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { Zone } from '@/lib/supabase';

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
          id,
          status,
          start_time,
          end_time,
          distance_traveled,
          total_minutes,
          estimated_cost,
          final_cost,
          created_at,
          updated_at,
          users:user_id(id, email, full_name),
          boats:boat_id(id, boat_name, status),
          start_zone:start_zone_id(id, zone_name),
          end_zone:end_zone_id(id, zone_name)
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
          id,
          status,
          created_at,
          updated_at,
          users:user_id(id, email, full_name),
          start_zone:start_zone_id(id, zone_name),
          end_zone:end_zone_id(id, zone_name)
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

  // Query to fetch all boats for stats
  const { 
    data: allBoats,
    isLoading: isLoadingAllBoats 
  } = useQuery({
    queryKey: ['admin', 'allBoats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('boats')
        .select('*');
        
      if (error) {
        console.error('Error fetching all boats:', error);
        throw error;
      }
      
      return data || [];
    },
    refetchOnWindowFocus: false
  });

  // Query to fetch all zones for stats and management
  const { 
    data: zones,
    isLoading: isLoadingZones
  } = useQuery({
    queryKey: ['zones'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('zones')
        .select('*')
        .order('zone_name', { ascending: true });
        
      if (error) {
        console.error('Error fetching zones:', error);
        throw error;
      }
      
      return data || [];
    }
  });

  // Compute boat statistics
  const boatStats = useMemo(() => {
    const total = allBoats?.length || 0;
    const available = allBoats?.filter(boat => boat.status === 'available').length || 0;
    const inUse = allBoats?.filter(boat => boat.status === 'in_use').length || 0;
    
    return { total, available, inUse };
  }, [allBoats]);

  // Compute reservation statistics
  const reservationStats = useMemo(() => {
    const active = reservations?.filter(res => res.status === 'in_progress').length || 0;
    const pending = pendingReservations?.length || 0;
    const completed = reservations?.filter(res => res.status === 'completed').length || 0;
    
    return { active, pending, completed };
  }, [reservations, pendingReservations]);

  // Compute zone statistics
  const zoneStats = useMemo(() => {
    const total = zones?.length || 0;
    
    // Find the most popular zone based on reservation count
    let zoneCounts: Record<string, number> = {};
    reservations?.forEach(res => {
      const startZoneId = res.start_zone?.[0]?.id;
      if (startZoneId) {
        zoneCounts[startZoneId] = (zoneCounts[startZoneId] || 0) + 1;
      }
    });
    
    let popularZoneId = '';
    let maxCount = 0;
    Object.entries(zoneCounts).forEach(([zoneId, count]) => {
      if (count > maxCount) {
        maxCount = count;
        popularZoneId = zoneId;
      }
    });
    
    const popular = zones?.find(z => z.id === popularZoneId)?.zone_name || 'None';
    
    return { total, popular };
  }, [zones, reservations]);

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
      queryClient.invalidateQueries({ queryKey: ['admin', 'allBoats'] });
      
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
      
      // Prepare the update data based on the new status
      const updateData: any = { 
        status: newStatus,
        updated_at: new Date().toISOString()
      };
      
      // Add specific timestamp fields based on status transition
      if (newStatus === 'in_progress') {
        updateData.start_time = new Date().toISOString();
      } else if (newStatus === 'completed') {
        updateData.end_time = new Date().toISOString();
      }
      
      // For awaiting_pickup status, no additional fields are needed
      
      console.log('Update data for status change:', updateData);
      
      // Perform the update
      const { data, error } = await supabase
        .from('reservations')
        .update(updateData)
        .eq('id', reservationId)
        .select();
        
      if (error) {
        console.error('Error updating reservation status:', error);
        throw error;
      }
      
      console.log('Status updated successfully:', data);
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reservations'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'pendingReservations'] });
      
      const statusMessages = {
        'in_progress': 'Trip started successfully',
        'awaiting_pickup': 'Boat marked for return successfully',
        'completed': 'Trip completed successfully',
        'canceled': 'Reservation canceled successfully'
      };
      
      const statusMessage = statusMessages[variables.newStatus as keyof typeof statusMessages] || 'Status updated successfully';
      
      toast({
        title: "Status Updated",
        description: statusMessage
      });
    },
    onError: (error) => {
      console.error('Error updating status:', error);
      toast({
        title: "Update Failed",
        description: "There was an error updating the reservation status. Please try again.",
        variant: "destructive"
      });
    }
  });

  return {
    reservations,
    pendingReservations,
    availableBoats,
    zones,
    isLoadingZones,
    isLoadingReservations,
    isLoadingBoats,
    isReservationsError,
    reservationsError,
    statusFilter,
    setStatusFilter,
    assignBoatMutation,
    updateReservationStatusMutation,
    // Add the computed statistics
    boatStats,
    reservationStats,
    zoneStats
  };
}
