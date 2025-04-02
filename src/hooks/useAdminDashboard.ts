
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export function useAdminDashboard() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const queryClient = useQueryClient();

  // Query to fetch all reservations with status filtering
  const { 
    data: reservations, 
    isLoading: isLoadingReservations,
    isError: isReservationsError,
    error: reservationsError,
    refetch: refetchReservations
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
      
      return data || [];
    },
    refetchOnWindowFocus: false
  });

  // Query to fetch pending reservations specifically
  const { 
    data: pendingReservations,
    refetch: refetchPendingReservations
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
      
      return data || [];
    },
    refetchOnWindowFocus: false
  });

  // Query to fetch available boats
  const { 
    data: availableBoats, 
    isLoading: isLoadingBoats,
    refetch: refetchAvailableBoats
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
      
      return data || [];
    },
    refetchOnWindowFocus: false
  });

  // Query to fetch all liaisons for assignment
  const { 
    data: availableLiaisons, 
    isLoading: isLoadingLiaisons 
  } = useQuery({
    queryKey: ['admin', 'availableLiaisons'],
    queryFn: async () => {
      console.log('Fetching available liaisons');
      
      const { data, error } = await supabase
        .from('company_liaisons')
        .select(`
          id,
          is_active,
          current_job_count,
          max_concurrent_jobs,
          users:user_id(id, email, full_name, phone_number)
        `)
        .eq('is_active', true)
        .lt('current_job_count', 3) // Only fetch liaisons who have capacity
        .order('current_job_count', { ascending: true });
        
      if (error) {
        console.error('Error fetching available liaisons:', error);
        throw error;
      }
      
      return data || [];
    },
    refetchOnWindowFocus: false
  });

  // Query to fetch all boats for stats
  const { 
    data: allBoats,
    isLoading: isLoadingAllBoats,
    refetch: refetchAllBoats
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
    const maintenance = allBoats?.filter(boat => boat.status === 'maintenance').length || 0;
    
    return { total, available, inUse, maintenance };
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
      if (res.start_zone && typeof res.start_zone !== 'string') {
        // Check if start_zone is an array with objects that have an id property
        if (Array.isArray(res.start_zone) && res.start_zone.length > 0 && res.start_zone[0] && 'id' in res.start_zone[0]) {
          const startZoneId = res.start_zone[0].id;
          if (startZoneId) {
            zoneCounts[startZoneId] = (zoneCounts[startZoneId] || 0) + 1;
          }
        } else if (res.start_zone_id) {
          // Fallback to start_zone_id if available
          zoneCounts[res.start_zone_id] = (zoneCounts[res.start_zone_id] || 0) + 1;
        }
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
      // Refetch all relevant queries to update UI
      refetchReservations();
      refetchPendingReservations();
      refetchAvailableBoats();
      refetchAllBoats();
      
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

  // Mutation to assign liaison to reservation/create delivery job
  const assignLiaisonMutation = useMutation({
    mutationFn: async ({ reservationId, liaisonId }: { reservationId: string, liaisonId: string }) => {
      console.log('Assigning liaison', liaisonId, 'to reservation', reservationId);
      
      // Create a delivery job for the reservation
      const { data, error } = await supabase
        .from('delivery_jobs')
        .insert([
          {
            reservation_id: reservationId,
            liaison_id: liaisonId,
            status: 'assigned',
            job_type: 'delivery',
            assigned_at: new Date().toISOString()
          }
        ])
        .select();
        
      if (error) {
        console.error('Error creating delivery job:', error);
        throw error;
      }
      
      // Update the liaison's job count
      const { error: liaisonError } = await supabase
        .from('company_liaisons')
        .update({ 
          current_job_count: 1 // Increment by 1 for new job
        })
        .eq('id', liaisonId);
        
      if (liaisonError) {
        console.error('Error updating liaison job count:', liaisonError);
        throw liaisonError;
      }
      
      return data;
    },
    onSuccess: () => {
      // Refetch relevant queries to update UI
      refetchReservations();
      
      toast({
        title: "Liaison Assigned",
        description: "A delivery executive has been assigned to handle this reservation."
      });
    },
    onError: (error) => {
      console.error('Error assigning liaison:', error);
      toast({
        title: "Assignment Failed",
        description: "There was an error assigning the delivery executive. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Mutation to update reservation status (admin has access to change to any status)
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
      refetchReservations();
      refetchPendingReservations();
      
      const statusMessages = {
        'pending': 'Reservation status set to pending',
        'confirmed': 'Reservation confirmed successfully',
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

  // Mutation to add a new boat
  const addBoatMutation = useMutation({
    mutationFn: async ({ boat_name }: { boat_name: string }) => {
      console.log('Adding new boat:', boat_name);
      
      const { data, error } = await supabase
        .from('boats')
        .insert([
          { 
            boat_name,
            status: 'available'
          }
        ])
        .select();
        
      if (error) {
        console.error('Error adding boat:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      refetchAllBoats();
      refetchAvailableBoats();
      
      toast({
        title: "Boat Added",
        description: "New boat has been added to the fleet."
      });
    },
    onError: (error) => {
      console.error('Error adding boat:', error);
      toast({
        title: "Failed to Add Boat",
        description: "There was an error adding the new boat. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Mutation to update boat status
  const updateBoatStatusMutation = useMutation({
    mutationFn: async ({ boatId, newStatus }: { boatId: string, newStatus: string }) => {
      console.log('Updating boat', boatId, 'status to', newStatus);
      
      const { data, error } = await supabase
        .from('boats')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', boatId)
        .select();
        
      if (error) {
        console.error('Error updating boat status:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      refetchAllBoats();
      refetchAvailableBoats();
      
      toast({
        title: "Boat Status Updated",
        description: "The boat status has been updated successfully."
      });
    },
    onError: (error) => {
      console.error('Error updating boat status:', error);
      toast({
        title: "Update Failed",
        description: "There was an error updating the boat status. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Mutation to update liaison job count
  const updateLiaisonJobCountMutation = useMutation({
    mutationFn: async ({ liaisonId }: { liaisonId: string }) => {
      console.log('Updating liaison job count for:', liaisonId);
      
      const { data, error } = await supabase
        .from('company_liaisons')
        .update({ 
          current_job_count: 1 // Increment by 1 for new job
        })
        .eq('id', liaisonId)
        .select();
        
      if (error) {
        console.error('Error updating liaison job count:', error);
        throw error;
      }
      
      return data;
    }
  });

  return {
    reservations,
    pendingReservations,
    availableBoats,
    availableLiaisons,
    allBoats,
    isLoadingLiaisons,
    zones,
    isLoadingZones,
    isLoadingReservations,
    isLoadingBoats,
    isReservationsError,
    reservationsError,
    statusFilter,
    setStatusFilter,
    assignBoatMutation,
    assignLiaisonMutation,
    updateReservationStatusMutation,
    addBoatMutation,
    updateBoatStatusMutation,
    boatStats,
    reservationStats,
    zoneStats,
    updateLiaisonJobCountMutation
  };
}
