
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { User, Boat, Reservation, Payment, Zone, Waiver, WaiverAcceptance } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

// =================== USER OPERATIONS ===================
export const useGetCurrentUser = () => {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      // Instead of directly querying the users table, get user profile info
      // from the auth metadata
      return {
        id: user.id,
        email: user.email,
        role: user.user_metadata?.role || 'customer',
        full_name: user.user_metadata?.full_name,
        phone_number: user.user_metadata?.phone_number
      } as User;
    }
  });
};

// =================== BOAT OPERATIONS ===================
export const useGetAvailableBoats = () => {
  return useQuery({
    queryKey: ['availableBoats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('boats')
        .select('*')
        .eq('status', 'available');
        
      if (error) throw error;
      return data as Boat[];
    }
  });
};

// =================== ZONE OPERATIONS ===================
export const useGetZones = () => {
  return useQuery({
    queryKey: ['zones'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('zones')
        .select('*');
        
      if (error) throw error;
      return data as Zone[];
    }
  });
};

// User Reservations Hook
export const useGetUserReservations = (userId?: string) => {
  const { user } = useAuth();
  const finalUserId = userId || user?.id;
  
  return useQuery({
    queryKey: ['userReservations', finalUserId],
    queryFn: async () => {
      if (!finalUserId) {
        return [];
      }

      const { data, error } = await supabase
        .from('reservations')
        .select(`
          id,
          status,
          start_time,
          end_time,
          estimated_cost,
          final_cost,
          created_at,
          boat:boat_id (boat_name),
          start_zone:start_zone_id (zone_name),
          end_zone:end_zone_id (zone_name)
        `)
        .eq('user_id', finalUserId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user reservations:', error);
        throw error;
      }

      return data;
    },
    enabled: !!finalUserId,
  });
};

export const useCreateReservation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newReservation: Partial<Reservation>) => {
      const { data, error } = await supabase
        .from('reservations')
        .insert([newReservation])
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['userReservations'] });
      toast({
        title: "Reservation Created",
        description: "Your boat reservation has been successfully created.",
      });
    },
    onError: (error) => {
      console.error('Error creating reservation:', error);
      toast({
        title: "Reservation Failed",
        description: "There was an error creating your reservation. Please try again.",
        variant: "destructive",
      });
    }
  });
};

// =================== WAIVER OPERATIONS ===================
export const useGetLatestWaiver = () => {
  return useQuery({
    queryKey: ['latestWaiver'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('waivers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
        
      if (error) throw error;
      return data as Waiver;
    }
  });
};

export const useAcceptWaiver = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (acceptance: Partial<WaiverAcceptance>) => {
      const { data, error } = await supabase
        .from('waiver_acceptances')
        .insert([acceptance])
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userWaivers'] });
      toast({
        title: "Waiver Accepted",
        description: "You have successfully accepted the waiver.",
      });
    }
  });
};

// =================== PAYMENT OPERATIONS ===================
export const useGetReservationPayments = (reservationId?: string) => {
  return useQuery({
    queryKey: ['reservationPayments', reservationId],
    queryFn: async () => {
      if (!reservationId) return [];
      
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('reservation_id', reservationId);
        
      if (error) throw error;
      return data as Payment[];
    },
    enabled: !!reservationId
  });
};
