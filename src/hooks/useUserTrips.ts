
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export const useUserTrips = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['userReservations', user?.id],
    queryFn: async () => {
      if (!user?.id) {
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
          boat:boat_id (boat_name),
          start_zone:start_zone_id (zone_name),
          end_zone:end_zone_id (zone_name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user reservations:', error);
        throw error;
      }

      return data;
    },
    enabled: !!user?.id,
  });
};
