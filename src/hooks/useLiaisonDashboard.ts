
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

// Define types for clarity
interface LiaisonProfile {
  id: string;
  user_id: string;
  is_active: boolean;
  current_location?: {
    lat: number;
    lng: number;
  };
  current_job_count: number;
  max_concurrent_jobs: number;
}

interface User {
  id: string;
  email: string;
  full_name?: string;
  phone_number?: string;
}

interface Zone {
  id: string;
  zone_name: string;
  coordinates: any;
}

interface DeliveryJob {
  id: string;
  reservation_id: string;
  status: string;
  job_type: string;
  assigned_at?: string;
  completed_at?: string;
  reservation?: {
    id: string;
    user_id: string;
    status: string;
    start_zone_id?: string;
    end_zone_id?: string;
    user?: User;
    start_zone?: Zone;
    end_zone?: Zone;
  };
}

export const useLiaisonDashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Get current liaison profile
  const { data: liaisonProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['liaisonProfile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('company_liaisons')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching liaison profile:', error);
        throw error;
      }

      return data as LiaisonProfile;
    },
    enabled: !!user?.id,
  });

  // Get available jobs
  const { data: availableJobs, isLoading: isLoadingAvailableJobs } = useQuery({
    queryKey: ['availableJobs'],
    queryFn: async () => {
      if (!liaisonProfile) return [];

      const { data, error } = await supabase
        .from('delivery_jobs')
        .select(`
          *,
          reservation:reservation_id (
            id,
            user_id,
            status,
            start_zone_id,
            end_zone_id,
            user:user_id (
              id,
              email,
              full_name,
              phone_number
            ),
            start_zone:start_zone_id (
              id,
              zone_name,
              coordinates
            ),
            end_zone:end_zone_id (
              id,
              zone_name,
              coordinates
            )
          )
        `)
        .eq('status', 'available');

      if (error) {
        console.error('Error fetching available jobs:', error);
        throw error;
      }

      console.log('Available jobs fetched:', data.length);
      return data as DeliveryJob[];
    },
    enabled: !!liaisonProfile,
  });

  // Get assigned jobs for this liaison
  const { data: assignedJobs, isLoading: isLoadingAssignedJobs } = useQuery({
    queryKey: ['assignedJobs', liaisonProfile?.id],
    queryFn: async () => {
      if (!liaisonProfile) return [];

      const { data, error } = await supabase
        .from('delivery_jobs')
        .select(`
          *,
          reservation:reservation_id (
            id,
            user_id,
            status,
            start_zone_id,
            end_zone_id,
            user:user_id (
              id,
              email,
              full_name,
              phone_number
            ),
            start_zone:start_zone_id (
              id,
              zone_name,
              coordinates
            ),
            end_zone:end_zone_id (
              id,
              zone_name,
              coordinates
            )
          )
        `)
        .eq('liaison_id', liaisonProfile.id)
        .eq('status', 'assigned');

      if (error) {
        console.error('Error fetching assigned jobs:', error);
        throw error;
      }

      console.log('Assigned jobs fetched:', data.length);
      return data as DeliveryJob[];
    },
    enabled: !!liaisonProfile?.id,
  });

  // Accept a job
  const acceptJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      if (!liaisonProfile || !liaisonProfile.id) {
        throw new Error('No liaison profile found');
      }

      console.log(`Accepting job: ${jobId}`);
      console.log(`Accepting job ${jobId} for liaison ${liaisonProfile.id}`);

      // Use the database function to safely assign the job
      const { data, error } = await supabase
        .rpc('assign_delivery_job', {
          job_id: jobId,
          assign_to_liaison_id: liaisonProfile.id
        });

      if (error) {
        console.error('Error in acceptJobMutation:', error);
        throw new Error('Failed to update job');
      }

      if (!data.success) {
        throw new Error(data.message);
      }

      return data;
    },
    onSuccess: (_, jobId) => {
      // Update queries
      queryClient.invalidateQueries({ queryKey: ['availableJobs'] });
      queryClient.invalidateQueries({ queryKey: ['assignedJobs'] });
      queryClient.invalidateQueries({ queryKey: ['liaisonProfile'] });
      
      toast({
        title: 'Job Accepted',
        description: 'You have successfully accepted this job',
      });
    },
    onError: (error: any) => {
      console.error('Error in acceptJobMutation:', error);
      toast({
        title: 'Error Accepting Job',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    },
  });

  // Complete a job
  const completeJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const updates = {
        status: 'completed',
        completed_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('delivery_jobs')
        .update(updates)
        .eq('id', jobId)
        .eq('liaison_id', liaisonProfile?.id)
        .select();

      if (error) {
        console.error('Error completing job:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignedJobs'] });
      queryClient.invalidateQueries({ queryKey: ['availableJobs'] });
      queryClient.invalidateQueries({ queryKey: ['liaisonProfile'] });
      
      toast({
        title: 'Job Completed',
        description: 'Job has been marked as completed',
      });
    },
  });

  // Update liaison's current location
  const updateLocationMutation = useMutation({
    mutationFn: async (location: { lat: number; lng: number }) => {
      if (!liaisonProfile?.id) return null;

      const { data, error } = await supabase
        .from('company_liaisons')
        .update({ current_location: location })
        .eq('id', liaisonProfile.id)
        .select();

      if (error) {
        console.error('Error updating location:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liaisonProfile'] });
    },
  });

  // Use browser's geolocation to update the liaison's position
  const updateCurrentLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          
          setCurrentLocation(newLocation);
          updateLocationMutation.mutate(newLocation);
        },
        (error) => {
          console.error('Error getting location:', error);
          toast({
            title: 'Location Error',
            description: 'Unable to retrieve your current location. Please enable location services.',
            variant: 'destructive',
          });
        }
      );
    } else {
      toast({
        title: 'Location Not Supported',
        description: 'Geolocation is not supported by your browser',
        variant: 'destructive',
      });
    }
  }, [updateLocationMutation]);

  // Format job data for display
  const formatJobsForDisplay = useCallback((jobs: DeliveryJob[]) => {
    return jobs.map(job => {
      // Check if reservation exists and extract information
      const reservation = job.reservation || {};
      
      return {
        id: job.id,
        status: job.status,
        jobType: job.job_type,
        assignedAt: job.assigned_at,
        completedAt: job.completed_at,
        
        // User information with fallbacks
        userId: reservation.user_id || '',
        userEmail: reservation.user?.email || '',
        userName: reservation.user?.full_name || '',
        userPhone: reservation.user?.phone_number || '',
        
        // Location information with fallbacks
        startZoneId: reservation.start_zone_id || '',
        startZoneName: reservation.start_zone?.zone_name || '',
        startZoneCoordinates: reservation.start_zone?.coordinates || null,
        
        endZoneId: reservation.end_zone_id || '',
        endZoneName: reservation.end_zone?.zone_name || '',
        endZoneCoordinates: reservation.end_zone?.coordinates || null,
        
        reservationId: job.reservation_id,
        reservationStatus: reservation.status || '',
      };
    });
  }, []);

  return {
    liaisonProfile,
    isLoadingProfile,
    availableJobs: formatJobsForDisplay(availableJobs || []),
    isLoadingAvailableJobs,
    assignedJobs: formatJobsForDisplay(assignedJobs || []),
    isLoadingAssignedJobs,
    acceptJob: (jobId: string) => acceptJobMutation.mutate(jobId),
    isAcceptingJob: acceptJobMutation.isPending,
    completeJob: (jobId: string) => completeJobMutation.mutate(jobId),
    isCompletingJob: completeJobMutation.isPending,
    updateCurrentLocation,
    isUpdatingLocation: updateLocationMutation.isPending,
    currentLocation,
  };
};
