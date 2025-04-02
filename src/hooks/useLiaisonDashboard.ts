
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { toast } from '@/hooks/use-toast';

export interface Reservation {
  id: string;
  status: string;
  users: {
    id: string;
    email: string;
    full_name: string;
    phone_number: string;
  }[];
  start_zone: {
    id: string;
    zone_name: string;
    coordinates: any;
  }[];
  end_zone: {
    id: string;
    zone_name: string;
    coordinates: any;
  }[];
}

export interface DeliveryJob {
  id: string;
  reservation_id: string;
  reservation: Reservation;
  liaison_id: string;
  job_type: 'delivery' | 'pickup';
  status: 'available' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  assigned_at: string;
  completed_at: string;
  created_at: string;
  updated_at: string;
}

export const useLiaisonDashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [liaisonId, setLiaisonId] = useState<string | null>(null);

  // Get the liaison ID for the current user
  useEffect(() => {
    const fetchLiaisonId = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('company_liaisons')
        .select('id')
        .eq('user_id', user.id)
        .single();
        
      if (error) {
        console.error('Error fetching liaison ID:', error);
        return;
      }
      
      if (data) {
        setLiaisonId(data.id);
        console.log("Liaison ID set:", data.id);
      }
    };
    
    fetchLiaisonId();
  }, [user]);

  // Query available jobs
  const { data: availableJobsData, isLoading: isAvailableLoading, refetch: refetchAvailableJobs } = useQuery({
    queryKey: ['availableJobs'],
    queryFn: async () => {
      console.log("Fetching available jobs...");
      const { data, error } = await supabase
        .from('delivery_jobs')
        .select(`
          id,
          reservation_id,
          job_type,
          status,
          created_at,
          reservation:reservation_id (
            id,
            status,
            users:user_id (
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
      
      console.log("Available jobs fetched:", data.length);
      
      // Process the data to ensure all jobs have properly formatted objects
      return data.map((job: any) => ({
        ...job,
        reservation: {
          ...job.reservation,
          users: job.reservation?.users ? (Array.isArray(job.reservation.users) ? job.reservation.users : [job.reservation.users]) : [],
          start_zone: job.reservation?.start_zone ? (Array.isArray(job.reservation.start_zone) ? job.reservation.start_zone : [job.reservation.start_zone]) : [],
          end_zone: job.reservation?.end_zone ? (Array.isArray(job.reservation.end_zone) ? job.reservation.end_zone : [job.reservation.end_zone]) : []
        }
      }));
    },
    enabled: !!user,
  });

  // Query assigned jobs
  const { data: assignedJobsData, isLoading: isAssignedLoading, refetch: refetchAssignedJobs } = useQuery({
    queryKey: ['assignedJobs', liaisonId],
    queryFn: async () => {
      if (!liaisonId) return [];
      
      console.log("Fetching assigned jobs for liaison:", liaisonId);
      const { data, error } = await supabase
        .from('delivery_jobs')
        .select(`
          id,
          reservation_id,
          job_type,
          status,
          assigned_at,
          completed_at,
          created_at,
          updated_at,
          reservation:reservation_id (
            id,
            status,
            users:user_id (
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
        .eq('liaison_id', liaisonId)
        .in('status', ['assigned', 'in_progress']);
        
      if (error) {
        console.error('Error fetching assigned jobs:', error);
        throw error;
      }
      
      console.log("Assigned jobs fetched:", data.length);
      
      // Process the data to ensure all jobs have properly formatted objects
      return data.map((job: any) => ({
        ...job,
        reservation: {
          ...job.reservation,
          users: job.reservation?.users ? (Array.isArray(job.reservation.users) ? job.reservation.users : [job.reservation.users]) : [],
          start_zone: job.reservation?.start_zone ? (Array.isArray(job.reservation.start_zone) ? job.reservation.start_zone : [job.reservation.start_zone]) : [],
          end_zone: job.reservation?.end_zone ? (Array.isArray(job.reservation.end_zone) ? job.reservation.end_zone : [job.reservation.end_zone]) : []
        }
      }));
    },
    enabled: !!liaisonId,
  });

  // Mutation to accept a job
  const acceptJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      if (!liaisonId) throw new Error('Liaison ID not found');
      
      console.log(`Accepting job ${jobId} for liaison ${liaisonId}`);
      
      // First verify that the job is still available (though we'll handle the errors appropriately if it's not)
      const { data: jobData, error: jobError } = await supabase
        .from('delivery_jobs')
        .select('*')
        .eq('id', jobId);
        
      if (jobError) {
        console.error('Error checking job availability:', jobError);
        throw new Error('Error checking job availability');
      }
      
      if (!jobData || jobData.length === 0 || jobData[0].status !== 'available') {
        console.error('Job is no longer available or has already been assigned');
        throw new Error('Job is no longer available');
      }
      
      // Use the Supabase RPC function for assigning the job in a transaction-safe way
      const { data: assignResult, error: assignError } = await supabase
        .rpc('assign_delivery_job', { 
          job_id: jobId, 
          assign_to_liaison_id: liaisonId 
        });
        
      if (assignError) {
        console.error('Error assigning job:', assignError);
        throw new Error('Failed to assign job');
      }
      
      if (!assignResult.success) {
        console.error('Job assignment failed:', assignResult.message);
        throw new Error(assignResult.message);
      }
      
      console.log('Job acceptance result:', assignResult);
      
      // Get the updated job data to return and update the cache
      const { data: updatedJobData, error: updatedJobError } = await supabase
        .from('delivery_jobs')
        .select(`
          id,
          reservation_id,
          job_type,
          status,
          assigned_at,
          completed_at,
          created_at,
          updated_at,
          liaison_id,
          reservation:reservation_id (
            id,
            status,
            users:user_id (
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
        .eq('id', jobId)
        .single();
        
      if (updatedJobError) {
        console.error('Error fetching updated job data:', updatedJobError);
        // We'll still consider this a success, since the job was assigned
      }
      
      console.log('Job accepted successfully, updated data:', updatedJobData);
      
      // Process the job data in the same format as our other queries
      const processedJobData = updatedJobData ? {
        ...updatedJobData,
        reservation: {
          ...updatedJobData.reservation,
          users: updatedJobData.reservation?.users ? (Array.isArray(updatedJobData.reservation.users) ? updatedJobData.reservation.users : [updatedJobData.reservation.users]) : [],
          start_zone: updatedJobData.reservation?.start_zone ? (Array.isArray(updatedJobData.reservation.start_zone) ? updatedJobData.reservation.start_zone : [updatedJobData.reservation.start_zone]) : [],
          end_zone: updatedJobData.reservation?.end_zone ? (Array.isArray(updatedJobData.reservation.end_zone) ? updatedJobData.reservation.end_zone : [updatedJobData.reservation.end_zone]) : []
        }
      } : null;
      
      return processedJobData || {
        id: jobId,
        status: 'assigned',
        liaison_id: liaisonId,
        reservation_id: jobData[0].reservation_id
      };
    },
    onSuccess: (data) => {
      console.log('Success data from job acceptance:', data);
      
      // Force immediate cache update by manually updating the cache
      queryClient.setQueryData(['availableJobs'], (oldData: any) => {
        if (!oldData) return [];
        return oldData.filter((job: any) => job.id !== data.id);
      });
      
      queryClient.setQueryData(['assignedJobs', liaisonId], (oldData: any) => {
        if (!oldData) return [data];
        return [...oldData, data];
      });
      
      // Then invalidate to ensure data consistency with server
      queryClient.invalidateQueries({ queryKey: ['availableJobs'] });
      queryClient.invalidateQueries({ queryKey: ['assignedJobs', liaisonId] });
      
      // Force immediate refetch to ensure UI is up-to-date
      setTimeout(() => {
        refetchAvailableJobs();
        refetchAssignedJobs();
      }, 500);
      
      toast({
        title: 'Job Accepted',
        description: 'You have successfully accepted this job',
      });
    },
    onError: (error: any) => {
      console.error('Error in acceptJobMutation:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to accept job',
        variant: 'destructive',
      });
    },
  });

  // Mutation to update job status
  const updateJobStatusMutation = useMutation({
    mutationFn: async ({ jobId, status }: { jobId: string; status: string }) => {
      console.log(`Updating job ${jobId} status to ${status}`);
      const { data, error } = await supabase
        .from('delivery_jobs')
        .update({ 
          status,
          ...(status === 'in_progress' ? {} : (status === 'completed' ? { completed_at: new Date().toISOString() } : {}))
        })
        .eq('id', jobId)
        .select()
        .single();
        
      if (error) {
        console.error('Error updating job status:', error);
        throw error;
      }
      
      console.log('Job status updated successfully');
      return data;
    },
    onSuccess: () => {
      console.log('Invalidating and refetching queries after updating job status');
      // Explicitly invalidate both query caches
      queryClient.invalidateQueries({ queryKey: ['assignedJobs', liaisonId] });
      queryClient.invalidateQueries({ queryKey: ['availableJobs'] });
      
      // Force immediate refetch
      setTimeout(() => {
        refetchAssignedJobs();
        refetchAvailableJobs();
      }, 100);
    },
    onError: (error: any) => {
      console.error('Error in updateJobStatusMutation:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update job status',
        variant: 'destructive',
      });
    },
  });

  // Mutation to update reservation status
  const updateReservationStatusMutation = useMutation({
    mutationFn: async ({ reservationId, status }: { reservationId: string; status: string }) => {
      console.log(`Updating reservation ${reservationId} status to ${status}`);
      const { data, error } = await supabase
        .from('reservations')
        .update({ status })
        .eq('id', reservationId)
        .select()
        .single();
        
      if (error) {
        console.error('Error updating reservation status:', error);
        throw error;
      }
      
      console.log('Reservation status updated successfully');
      return data;
    },
    onSuccess: () => {
      console.log('Invalidating and refetching queries after updating reservation status');
      // Explicitly invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['assignedJobs', liaisonId] });
      queryClient.invalidateQueries({ queryKey: ['availableJobs'] });
      
      // Force immediate refetch
      setTimeout(() => {
        refetchAssignedJobs();
        refetchAvailableJobs();
      }, 100);
    },
    onError: (error: any) => {
      console.error('Error in updateReservationStatusMutation:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update reservation status',
        variant: 'destructive',
      });
    },
  });

  // Function to resign a job
  const resignJob = async (jobId: string) => {
    try {
      console.log(`Resigning job ${jobId}`);
      // Get the job details first
      const { data: jobData, error: jobError } = await supabase
        .from('delivery_jobs')
        .select('*')
        .eq('id', jobId)
        .single();
        
      if (jobError) {
        console.error('Error getting job details:', jobError);
        throw jobError;
      }
      
      // Update the job status to available and remove liaison assignment
      const { error } = await supabase
        .from('delivery_jobs')
        .update({ 
          status: 'available',
          liaison_id: null
        })
        .eq('id', jobId);
        
      if (error) {
        console.error('Error updating job status:', error);
        throw error;
      }
      
      // Update the liaison's job count
      if (liaisonId) {
        const { error: updateError } = await supabase
          .from('company_liaisons')
          .update({ 
            current_job_count: supabase.rpc('greatest', { a: 0, b: -1 })
          })
          .eq('id', liaisonId);
          
        if (updateError) {
          console.error('Error updating liaison job count:', updateError);
          throw updateError;
        }
      }
      
      console.log('Job resigned successfully');
      
      // Explicitly invalidate queries and force refetch
      queryClient.invalidateQueries({ queryKey: ['assignedJobs', liaisonId] });
      queryClient.invalidateQueries({ queryKey: ['availableJobs'] });
      
      setTimeout(() => {
        refetchAssignedJobs();
        refetchAvailableJobs();
      }, 100);
      
      toast({
        title: 'Job Resigned',
        description: 'You have resigned from this job',
      });
    } catch (error: any) {
      console.error('Error in resignJob:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to resign job',
        variant: 'destructive',
      });
    }
  };

  // Function to accept a job
  const acceptJob = (jobId: string) => {
    console.log(`Accepting job: ${jobId}`);
    acceptJobMutation.mutate(jobId);
  };

  // Function to start delivery
  const startDelivery = async (jobId: string) => {
    try {
      console.log(`Starting delivery for job ${jobId}`);
      await updateJobStatusMutation.mutateAsync({ jobId, status: 'in_progress' });
      toast({
        title: 'Delivery Started',
        description: 'You have started the delivery',
      });
    } catch (error) {
      console.error('Error starting delivery:', error);
    }
  };

  // Function to complete delivery (Liaison delivers the boat to customer)
  const completeDelivery = async (jobId: string) => {
    try {
      console.log(`Completing delivery for job ${jobId}`);
      const { data: jobData } = await supabase
        .from('delivery_jobs')
        .select('reservation_id')
        .eq('id', jobId)
        .single();
        
      if (!jobData) {
        console.error('Job not found');
        throw new Error('Job not found');
      }
      
      // Update job status
      await updateJobStatusMutation.mutateAsync({ jobId, status: 'completed' });
      
      // Update reservation status to in_progress (customer can start using the boat)
      await updateReservationStatusMutation.mutateAsync({ 
        reservationId: jobData.reservation_id, 
        status: 'in_progress' 
      });
      
      toast({
        title: 'Delivery Completed',
        description: 'You have completed the delivery. The customer can now use the boat.',
      });
      
      // Force refetch to update the UI
      queryClient.invalidateQueries({ queryKey: ['assignedJobs', liaisonId] });
      queryClient.invalidateQueries({ queryKey: ['availableJobs'] });
      
      setTimeout(() => {
        refetchAssignedJobs();
        refetchAvailableJobs();
      }, 100);
    } catch (error) {
      console.error('Error completing delivery:', error);
    }
  };

  // Function to start pickup
  const startPickup = async (jobId: string) => {
    try {
      console.log(`Starting pickup for job ${jobId}`);
      await updateJobStatusMutation.mutateAsync({ jobId, status: 'in_progress' });
      toast({
        title: 'Pickup Started',
        description: 'You have started the pickup',
      });
    } catch (error) {
      console.error('Error starting pickup:', error);
    }
  };

  // Function to complete pickup (Liaison retrieves the boat after customer finishes)
  const completePickup = async (jobId: string) => {
    try {
      console.log(`Completing pickup for job ${jobId}`);
      const { data: jobData } = await supabase
        .from('delivery_jobs')
        .select('reservation_id')
        .eq('id', jobId)
        .single();
        
      if (!jobData) {
        console.error('Job not found');
        throw new Error('Job not found');
      }
      
      // Update job status
      await updateJobStatusMutation.mutateAsync({ jobId, status: 'completed' });
      
      // Update reservation status to completed
      await updateReservationStatusMutation.mutateAsync({ 
        reservationId: jobData.reservation_id, 
        status: 'completed' 
      });
      
      // Update the boat status to available
      const { data: reservationData } = await supabase
        .from('reservations')
        .select('boat_id')
        .eq('id', jobData.reservation_id)
        .single();
        
      if (reservationData?.boat_id) {
        await supabase
          .from('boats')
          .update({ status: 'available' })
          .eq('id', reservationData.boat_id);
      }
      
      toast({
        title: 'Pickup Completed',
        description: 'You have completed the pickup and the reservation is now finished',
      });
      
      // Force refetch to update the UI
      queryClient.invalidateQueries({ queryKey: ['assignedJobs', liaisonId] });
      queryClient.invalidateQueries({ queryKey: ['availableJobs'] });
      
      setTimeout(() => {
        refetchAssignedJobs();
        refetchAvailableJobs();
      }, 100);
    } catch (error) {
      console.error('Error completing pickup:', error);
    }
  };

  return {
    availableJobs: availableJobsData || [],
    assignedJobs: assignedJobsData || [],
    isLoading: isAvailableLoading || isAssignedLoading,
    acceptJob,
    startDelivery,
    completeDelivery,
    startPickup,
    completePickup,
    resignJob,
  };
};
