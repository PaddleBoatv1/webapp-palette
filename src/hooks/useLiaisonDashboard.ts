
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

// Define refined types based on actual Supabase return types
interface LiaisonProfile {
  id: string;
  user_id: string;
  is_active: boolean;
  current_job_count: number;
  max_concurrent_jobs: number;
}

interface User {
  id: string;
  email: string;
  full_name?: string | null;
  phone_number?: string | null;
}

interface Zone {
  id: string;
  zone_name: string;
  coordinates: any;
}

interface Reservation {
  id: string;
  user_id: string;
  status: string;
  start_zone_id?: string | null;
  end_zone_id?: string | null;
  user?: User | null;
  start_zone?: Zone | null;
  end_zone?: Zone | null;
}

interface DeliveryJob {
  id: string;
  reservation_id: string;
  status: string;
  job_type: string;
  liaison_id?: string | null;
  assigned_at?: string | null;
  completed_at?: string | null;
  reservation?: Reservation | null;
}

// Interface for formatted job data
interface FormattedJob {
  id: string;
  status: string;
  jobType: string;
  assignedAt: string;
  completedAt: string;
  userId: string;
  userEmail: string;
  userName: string;
  userPhone: string;
  startZoneId: string;
  startZoneName: string;
  startZoneCoordinates: any;
  endZoneId: string;
  endZoneName: string;
  endZoneCoordinates: any;
  reservationId: string;
  reservationStatus: string;
}

// Type for the response from assign_delivery_job RPC function
interface AssignJobResponse {
  success: boolean;
  message: string;
}

export const useLiaisonDashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

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
      return data as unknown as DeliveryJob[];
    },
    enabled: !!liaisonProfile,
  });

  // Get assigned jobs for this liaison - MODIFIED to include both 'assigned' and 'in_progress' statuses
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
        .in('status', ['assigned', 'in_progress']); // Changed to include both statuses

      if (error) {
        console.error('Error fetching assigned jobs:', error);
        throw error;
      }

      console.log('Assigned jobs fetched:', data.length);
      return data as unknown as DeliveryJob[];
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

      // Check job status before attempting to assign
      const { data: jobData, error: jobError } = await supabase
        .from('delivery_jobs')
        .select('id, reservation_id, job_type, status')
        .eq('id', jobId)
        .single();

      if (jobError) {
        console.error('Error fetching job details:', jobError);
        throw new Error('Job not found');
      }

      if (jobData.status !== 'available') {
        throw new Error('This job is no longer available');
      }

      console.log('Job data:', jobData); // Debug log to see the job data structure
      console.log('Reservation ID from job:', jobData.reservation_id); // Debug log

      // Check liaison capacity
      if (liaisonProfile.current_job_count >= liaisonProfile.max_concurrent_jobs) {
        throw new Error('You have reached your maximum job capacity');
      }

      // Check if the liaison is already assigned to another job for the same reservation
      // This prevents double-counting when assigning both delivery and pickup jobs
      if (!jobData.reservation_id) {
        console.error('Job has no reservation_id, cannot check for existing assignments');
        throw new Error('Invalid job data: missing reservation ID');
      }
      
      const { data: existingJobs, error: existingJobsError } = await supabase
        .from('delivery_jobs')
        .select('id, job_type, reservation_id')
        .eq('reservation_id', jobData.reservation_id)
        .eq('liaison_id', liaisonProfile.id);

      console.log('Existing jobs check:', existingJobs); // Debug log
        
      if (existingJobsError) {
        console.error('Error checking existing jobs:', existingJobsError);
      } else if (existingJobs && existingJobs.length > 0) {
        console.log('Liaison already has a job for this reservation, not incrementing count');
        
        // Just update the job status without increasing the count
        const { data, error } = await supabase
          .from('delivery_jobs')
          .update({ 
            liaison_id: liaisonProfile.id,
            status: 'assigned',
            assigned_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', jobId)
          .select();
          
        if (error) {
          console.error('Error updating job without incrementing count:', error);
          throw new Error(error.message || 'Failed to update job');
        }
        
        return { success: true, message: 'Job assigned successfully' };
      }

      // Use the database function to safely assign the job when it's a new reservation
      const { data, error } = await supabase
        .rpc('assign_delivery_job', {
          job_id: jobId,
          assign_to_liaison_id: liaisonProfile.id
        });

      if (error) {
        console.error('Error in acceptJobMutation:', error);
        throw new Error(error.message || 'Failed to update job');
      }

      // Handle the response from the RPC function
      const response = data as unknown as AssignJobResponse;
      
      if (!response.success) {
        throw new Error(response.message || 'Could not assign job');
      }

      return response;
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

  // Start delivery (transition job from assigned to in_progress)
  const startDeliveryMutation = useMutation({
    mutationFn: async (jobId: string) => {
      // Only update the job status, don't change the liaison assignment
      const { data, error } = await supabase
        .from('delivery_jobs')
        .update({ status: 'in_progress' })
        .eq('id', jobId)
        .eq('liaison_id', liaisonProfile?.id)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignedJobs'] });
      toast({
        title: 'Delivery Started',
        description: 'You have started the delivery process',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error Starting Delivery',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    },
  });

  // Complete delivery
  const completeDeliveryMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const { data, error } = await supabase
        .from('delivery_jobs')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', jobId)
        .eq('liaison_id', liaisonProfile?.id)
        .select();

      if (error) throw error;
      
      // Find the job to get the reservation ID
      const job = assignedJobs?.find(j => j.id === jobId);
      
      if (job && job.reservation) {
        // If it's a delivery job, set the reservation to in_progress
        if (job.job_type === 'delivery') {
          const { error: resError } = await supabase
            .from('reservations')
            .update({ status: 'in_progress', start_time: new Date().toISOString() })
            .eq('id', job.reservation_id);
            
          if (resError) throw resError;
        }
      }
      
      // REMOVED: Don't decrease the liaison's job count when completing delivery
      // The job is still assigned to the liaison until pickup is done
      // This ensures the job still appears in the liaison's assigned jobs
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignedJobs'] });
      // Don't invalidate the liaisonProfile as we're keeping the job count the same
      toast({
        title: 'Delivery Completed',
        description: 'You have successfully delivered the boat to the customer. The customer can now use the boat. You will be assigned to pick up when the customer ends their trip.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error Completing Delivery',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    },
  });

  // Start pickup
  const startPickupMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const { data, error } = await supabase
        .from('delivery_jobs')
        .update({ status: 'in_progress' })
        .eq('id', jobId)
        .eq('liaison_id', liaisonProfile?.id)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignedJobs'] });
      toast({
        title: 'Pickup Started',
        description: 'You have started the pickup process',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error Starting Pickup',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    },
  });

  // Complete pickup
  const completePickupMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const { data, error } = await supabase
        .from('delivery_jobs')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', jobId)
        .eq('liaison_id', liaisonProfile?.id)
        .select();

      if (error) throw error;
      
      // Also update the reservation status to completed
      const job = assignedJobs?.find(j => j.id === jobId);
      if (job && job.reservation) {
        // Update boat status to available for new rentals
        const { data: reservationData, error: resQueryError } = await supabase
          .from('reservations')
          .select('boat_id')
          .eq('id', job.reservation_id)
          .single();
          
        if (resQueryError) throw resQueryError;
        
        if (reservationData.boat_id) {
          // Update the boat status to available
          const { error: boatError } = await supabase
            .from('boats')
            .update({ status: 'available' })
            .eq('id', reservationData.boat_id);
            
          if (boatError) throw boatError;
        }
        
        const { error: resError } = await supabase
          .from('reservations')
          .update({ 
            status: 'completed',
            end_time: new Date().toISOString()
          })
          .eq('id', job.reservation_id);
          
        if (resError) throw resError;
      }
      
      // Now decrease the liaison's job count since a completed pickup fully completes the job cycle
      if (liaisonProfile?.id) {
        const { error: liaisionError } = await supabase
          .from('company_liaisons')
          .update({ 
            current_job_count: Math.max(0, (liaisonProfile.current_job_count - 1))
          })
          .eq('id', liaisonProfile.id);
          
        if (liaisionError) {
          console.error('Error updating liaison capacity:', liaisionError);
          // We don't want to throw here, as the primary operation succeeded
        }
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignedJobs'] });
      queryClient.invalidateQueries({ queryKey: ['liaisonProfile'] });
      toast({
        title: 'Pickup Completed',
        description: 'You have completed the pickup. The boat is now available for new rentals.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error Completing Pickup',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    },
  });

  // Resign from a job
  const resignJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const { data, error } = await supabase
        .from('delivery_jobs')
        .update({ 
          status: 'available',
          liaison_id: null,
          assigned_at: null 
        })
        .eq('id', jobId)
        .eq('liaison_id', liaisonProfile?.id)
        .select();

      if (error) throw error;
      
      // Manually decrease the liaison's job count since resigning from a job frees up capacity
      if (liaisonProfile?.id) {
        const { error: liaisionError } = await supabase
          .from('company_liaisons')
          .update({ 
            current_job_count: Math.max(0, (liaisonProfile.current_job_count - 1))
          })
          .eq('id', liaisonProfile.id);
          
        if (liaisionError) {
          console.error('Error updating liaison capacity:', liaisionError);
          // We don't want to throw here, as the primary operation succeeded
        }
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignedJobs'] });
      queryClient.invalidateQueries({ queryKey: ['availableJobs'] });
      queryClient.invalidateQueries({ queryKey: ['liaisonProfile'] });
      toast({
        title: 'Job Resigned',
        description: 'You have resigned from this job',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error Resigning Job',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    },
  });

  // Format job data for display with proper fallbacks to prevent type errors
  const formatJobsForDisplay = useCallback((jobs: DeliveryJob[]): FormattedJob[] => {
    return jobs.map(job => {
      const reservation = job.reservation || {} as Reservation;
      const user = reservation.user || {} as User;
      const start_zone = reservation.start_zone || {} as Zone;
      const end_zone = reservation.end_zone || {} as Zone;
      
      return {
        id: job.id,
        status: job.status,
        jobType: job.job_type,
        assignedAt: job.assigned_at || '',
        completedAt: job.completed_at || '',
        
        // User information with fallbacks
        userId: reservation.user_id || '',
        userEmail: user.email || '',
        userName: user.full_name || '',
        userPhone: user.phone_number || '',
        
        // Location information with fallbacks
        startZoneId: reservation.start_zone_id || '',
        startZoneName: start_zone.zone_name || '',
        startZoneCoordinates: start_zone.coordinates || null,
        
        endZoneId: reservation.end_zone_id || '',
        endZoneName: end_zone.zone_name || '',
        endZoneCoordinates: end_zone.coordinates || null,
        
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
    isLoading: isLoadingProfile || isLoadingAvailableJobs || isLoadingAssignedJobs,
    
    // Job management functions
    acceptJob: (jobId: string) => acceptJobMutation.mutate(jobId),
    isAcceptingJob: acceptJobMutation.isPending,
    
    startDelivery: (jobId: string) => startDeliveryMutation.mutate(jobId),
    isStartingDelivery: startDeliveryMutation.isPending,
    
    completeDelivery: (jobId: string) => completeDeliveryMutation.mutate(jobId),
    isCompletingDelivery: completeDeliveryMutation.isPending,
    
    startPickup: (jobId: string) => startPickupMutation.mutate(jobId),
    isStartingPickup: startPickupMutation.isPending,
    
    completePickup: (jobId: string) => completePickupMutation.mutate(jobId),
    isCompletingPickup: completePickupMutation.isPending,
    
    resignJob: (jobId: string) => resignJobMutation.mutate(jobId),
    isResigningJob: resignJobMutation.isPending,
  };
};
