
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface Job {
  id: string;
  reservationId: string;
  jobType: string;
  status: string;
  assignedAt?: string;
  completedAt?: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  startZoneName?: string;
  endZoneName?: string;
}

interface AssignJobResponse {
  success: boolean;
  message?: string;
}

export function useLiaisonDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [liaisonId, setLiaisonId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchLiaisonId();
    }
  }, [user?.id]);

  const fetchLiaisonId = async () => {
    try {
      const { data, error } = await supabase
        .from('company_liaisons')
        .select('*')
        .eq('user_id', user?.id);

      if (error) {
        console.error('Error fetching liaison id:', error);
        return;
      }

      if (data && data.length > 0) {
        setLiaisonId(data[0].id);
      }
    } catch (error) {
      console.error('Exception fetching liaison id:', error);
    }
  };

  // Query to fetch liaison profile
  const { data: liaisonProfile } = useQuery({
    queryKey: ['liaison', 'profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('company_liaisons')
        .select('*')
        .eq('user_id', user?.id);
        
      if (error) {
        console.error('Error fetching liaison profile:', error);
        throw error;
      }
      
      return data && data.length > 0 ? data[0] : null;
    },
    enabled: !!user?.id
  });

  // Query to fetch available jobs
  const { 
    data: availableJobsRaw, 
    isLoading: isLoadingAvailable,
    refetch: refetchAvailableJobs
  } = useQuery({
    queryKey: ['liaison', 'availableJobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_jobs')
        .select(`
          *,
          reservation:reservation_id(
            id,
            user_id,
            status,
            start_zone_id,
            end_zone_id,
            user:user_id(id, email, full_name, phone_number),
            start_zone:start_zone_id(id, zone_name, coordinates),
            end_zone:end_zone_id(id, zone_name, coordinates)
          )
        `)
        .eq('status', 'available');
        
      if (error) {
        console.error('Error fetching available jobs:', error);
        throw error;
      }
      
      console.log('Available jobs fetched:', data ? data.length : 0);
      return data || [];
    },
    refetchInterval: 30000 // Refetch every 30 seconds
  });
  
  // Query to fetch assigned jobs
  const { 
    data: assignedJobsRaw, 
    isLoading: isLoadingAssigned,
    refetch: refetchAssignedJobs
  } = useQuery({
    queryKey: ['liaison', 'assignedJobs', liaisonId],
    queryFn: async () => {
      if (!liaisonId) return [];
      
      const { data, error } = await supabase
        .from('delivery_jobs')
        .select(`
          *,
          reservation:reservation_id(
            id,
            user_id,
            status,
            start_zone_id,
            end_zone_id,
            user:user_id(id, email, full_name, phone_number),
            start_zone:start_zone_id(id, zone_name, coordinates),
            end_zone:end_zone_id(id, zone_name, coordinates)
          )
        `)
        .eq('liaison_id', liaisonId)
        .in('status', ['assigned', 'in_progress']);
        
      if (error) {
        console.error('Error fetching assigned jobs:', error);
        throw error;
      }
      
      console.log('Assigned jobs fetched:', data ? data.length : 0);
      return data || [];
    },
    enabled: !!liaisonId,
    refetchInterval: 15000 // Refetch every 15 seconds
  });

  // Query to fetch completed jobs
  const { 
    data: completedJobsRaw, 
    isLoading: isLoadingCompleted,
    refetch: refetchCompletedJobs
  } = useQuery({
    queryKey: ['liaison', 'completedJobs', liaisonId],
    queryFn: async () => {
      if (!liaisonId) return [];
      
      const { data, error } = await supabase
        .from('delivery_jobs')
        .select(`
          *,
          reservation:reservation_id(
            id,
            user_id,
            status,
            start_zone_id,
            end_zone_id,
            user:user_id(id, email, full_name, phone_number),
            start_zone:start_zone_id(id, zone_name, coordinates),
            end_zone:end_zone_id(id, zone_name, coordinates)
          )
        `)
        .eq('liaison_id', liaisonId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(20); // Limit to the most recent 20 completed jobs
        
      if (error) {
        console.error('Error fetching completed jobs:', error);
        throw error;
      }
      
      console.log('Completed jobs fetched:', data ? data.length : 0);
      return data || [];
    },
    enabled: !!liaisonId,
    refetchInterval: 60000 // Refetch every minute
  });

  // Transform raw job data
  const transformJobData = (jobsRaw: any[]): Job[] => {
    return jobsRaw.map(job => ({
      id: job.id,
      reservationId: job.reservation_id,
      jobType: job.job_type,
      status: job.status,
      assignedAt: job.assigned_at,
      completedAt: job.completed_at,
      userName: job.reservation?.user?.[0]?.full_name || 'Unknown',
      userEmail: job.reservation?.user?.[0]?.email,
      userPhone: job.reservation?.user?.[0]?.phone_number,
      startZoneName: job.reservation?.start_zone?.[0]?.zone_name,
      endZoneName: job.reservation?.end_zone?.[0]?.zone_name
    }));
  };

  // Prepare job lists from raw data
  const availableJobs = availableJobsRaw ? transformJobData(availableJobsRaw) : [];
  const assignedJobs = assignedJobsRaw ? transformJobData(assignedJobsRaw) : [];
  const completedJobs = completedJobsRaw ? transformJobData(completedJobsRaw) : [];

  // Mutation to accept a job
  const acceptJobMutation = useMutation({
    mutationFn: async (jobId: string): Promise<AssignJobResponse> => {
      console.log('Accepting job:', jobId);
      
      if (!liaisonId) {
        throw new Error('Liaison ID not found. Please refresh and try again.');
      }
      
      console.log('Accepting job', jobId, 'for liaison', liaisonId);
      
      // First, fetch details about the job to check if it's still available
      const { data: jobData, error: jobError } = await supabase
        .from('delivery_jobs')
        .select('id, reservation_id, job_type, status')
        .eq('id', jobId);
        
      if (jobError) {
        console.error('Error fetching job details:', jobError);
        throw new Error('Could not fetch job details');
      }
      
      if (!jobData || jobData.length === 0) {
        throw new Error('Job not found or already taken');
      }
      
      console.log('Job data:', jobData[0]);
      
      // Check if the liaison already has a job for this reservation
      // We don't want to increment the job count in this case
      console.log('Checking for existing jobs for reservation:', jobData[0].reservation_id);
      const { data: existingJobs, error: existingJobsError } = await supabase
        .from('delivery_jobs')
        .select('id, job_type')
        .eq('reservation_id', jobData[0].reservation_id)
        .eq('liaison_id', liaisonId);
        
      if (existingJobsError) {
        console.error('Error checking for existing jobs:', existingJobsError);
      } else {
        console.log('Existing jobs for this reservation:', existingJobs);
      }
      
      const hasExistingJobForReservation = existingJobs && existingJobs.length > 0;
      
      // Assign the job directly
      if (!hasExistingJobForReservation) {
        try {
          // Update the job with the liaison ID and change status to 'assigned'
          const { data, error } = await supabase
            .from('delivery_jobs')
            .update({
              liaison_id: liaisonId,
              status: 'assigned',
              assigned_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', jobId)
            .eq('status', 'available') // Ensure job is still available
            .select('*');
            
          if (error) {
            console.error('Error updating job:', error);
            // Don't throw yet, we'll try the RPC function
          } else if (data && data.length > 0) {
            console.log('Job assigned successfully:', data);
            return { success: true, message: 'Job assigned successfully' };
          }
        } catch (updateError) {
          console.error('Exception updating job:', updateError);
          // Continue to fallback
        }
      } else {
        // If liaison already has a job for this reservation, just update without incrementing count
        try {
          // Update the job without incrementing the count
          const { data, error } = await supabase
            .from('delivery_jobs')
            .update({
              liaison_id: liaisonId,
              status: 'assigned',
              assigned_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', jobId)
            .select('*');
            
          if (error) {
            console.error('Error updating job without incrementing count:', error);
            // Don't throw yet, we'll try the RPC function
          } else if (data && data.length > 0) {
            console.log('Job assigned successfully without incrementing count:', data);
            return { success: true, message: 'Job assigned successfully' };
          }
        } catch (updateError) {
          console.error('Exception updating job without incrementing count:', updateError);
          // Continue to fallback
        }
      }
      
      // If the direct update failed, use the update_delivery_job_assignment RPC as a fallback
      console.log('Using RPC fallback for job assignment');
      const { data, error } = await supabase.rpc('update_delivery_job_assignment', {
        job_id: jobId,
        liaison_id: liaisonId
      });
      
      if (error) {
        console.error('Error assigning job with RPC:', error);
        throw new Error(error.message || 'Failed to assign job');
      }
      
      // Verify the assignment worked by fetching the job again
      const { data: verifyJob } = await supabase
        .from('delivery_jobs')
        .select('*')
        .eq('id', jobId);
        
      if (!verifyJob || verifyJob.length === 0 || verifyJob[0].liaison_id !== liaisonId) {
        console.error('Job assignment verification failed');
        throw new Error('Job assignment could not be verified');
      }
      
      console.log('Job assigned successfully via RPC method:', verifyJob);
      
      if (!hasExistingJobForReservation) {
        // Manually increment the liaison's job count
        const { error: countError } = await supabase
          .from('company_liaisons')
          .update({ current_job_count: liaisonProfile?.current_job_count ? liaisonProfile.current_job_count + 1 : 1 })
          .eq('id', liaisonId);
          
        if (countError) {
          console.error('Error incrementing liaison job count:', countError);
          // Don't throw, the assignment was successful
        }
      }
      
      return { success: true, message: 'Job assigned successfully' };
    },
    onSuccess: (_, jobId) => {
      // Update queries
      queryClient.invalidateQueries({ queryKey: ['liaison', 'availableJobs'] });
      queryClient.invalidateQueries({ queryKey: ['liaison', 'assignedJobs'] });
      queryClient.invalidateQueries({ queryKey: ['liaison', 'profile'] });
      
      toast({
        title: "Job Accepted",
        description: "You have successfully accepted the job."
      });
    },
    onError: (error) => {
      console.error('Error accepting job:', error);
      toast({
        title: "Acceptance Failed",
        description: error instanceof Error ? error.message : "There was an error accepting the job. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Mutation to start delivery
  const startDeliveryMutation = useMutation({
    mutationFn: async (jobId: string) => {
      console.log('Starting delivery for job:', jobId);
      
      const { data, error } = await supabase
        .from('delivery_jobs')
        .update({
          status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId)
        .eq('status', 'assigned') // Ensure the job is in assigned status
        .select('*');
        
      if (error) {
        console.error('Error starting delivery:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liaison', 'assignedJobs'] });
      
      toast({
        title: "Delivery Started",
        description: "You have started the delivery. Drive safely!"
      });
    },
    onError: (error) => {
      console.error('Error starting delivery:', error);
      toast({
        title: "Start Failed",
        description: "There was an error starting the delivery. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Mutation to complete delivery
  const completeDeliveryMutation = useMutation({
    mutationFn: async (jobId: string) => {
      console.log('Completing delivery for job:', jobId);
      
      // First fetch the delivery job to get the reservation ID
      const { data: jobData, error: jobError } = await supabase
        .from('delivery_jobs')
        .select('reservation_id')
        .eq('id', jobId)
        .single();
        
      if (jobError) {
        console.error('Error fetching job data:', jobError);
        throw jobError;
      }
      
      // Update the delivery job status
      const { data, error } = await supabase
        .from('delivery_jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId)
        .eq('status', 'in_progress') // Ensure the job is in progress
        .select('*');
        
      if (error) {
        console.error('Error completing delivery:', error);
        throw error;
      }
      
      // Update the reservation status to in_progress
      const { error: reservationError } = await supabase
        .from('reservations')
        .update({
          status: 'in_progress',
          start_time: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', jobData.reservation_id);
        
      if (reservationError) {
        console.error('Error updating reservation status:', reservationError);
        throw reservationError;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liaison', 'assignedJobs'] });
      queryClient.invalidateQueries({ queryKey: ['liaison', 'completedJobs'] });
      
      toast({
        title: "Delivery Completed",
        description: "You have successfully completed the delivery."
      });
    },
    onError: (error) => {
      console.error('Error completing delivery:', error);
      toast({
        title: "Completion Failed",
        description: "There was an error completing the delivery. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Mutation to start pickup
  const startPickupMutation = useMutation({
    mutationFn: async (jobId: string) => {
      console.log('Starting pickup for job:', jobId);
      
      const { data, error } = await supabase
        .from('delivery_jobs')
        .update({
          status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId)
        .eq('status', 'assigned') // Ensure the job is in assigned status
        .select('*');
        
      if (error) {
        console.error('Error starting pickup:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liaison', 'assignedJobs'] });
      
      toast({
        title: "Pickup Started",
        description: "You have started the boat pickup. Drive safely!"
      });
    },
    onError: (error) => {
      console.error('Error starting pickup:', error);
      toast({
        title: "Start Failed",
        description: "There was an error starting the pickup. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Mutation to complete pickup
  const completePickupMutation = useMutation({
    mutationFn: async (jobId: string) => {
      console.log('Completing pickup for job:', jobId);
      
      // First fetch the pickup job to get the reservation ID
      const { data: jobData, error: jobError } = await supabase
        .from('delivery_jobs')
        .select('reservation_id')
        .eq('id', jobId)
        .single();
        
      if (jobError) {
        console.error('Error fetching job data:', jobError);
        throw jobError;
      }
      
      // Update the pickup job status
      const { data, error } = await supabase
        .from('delivery_jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId)
        .eq('status', 'in_progress') // Ensure the job is in progress
        .select('*');
        
      if (error) {
        console.error('Error completing pickup:', error);
        throw error;
      }
      
      // Update the reservation status to completed
      const { error: reservationError } = await supabase
        .from('reservations')
        .update({
          status: 'completed',
          end_time: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', jobData.reservation_id);
        
      if (reservationError) {
        console.error('Error updating reservation status:', reservationError);
        throw reservationError;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liaison', 'assignedJobs'] });
      queryClient.invalidateQueries({ queryKey: ['liaison', 'completedJobs'] });
      
      toast({
        title: "Pickup Completed",
        description: "You have successfully completed the boat pickup."
      });
    },
    onError: (error) => {
      console.error('Error completing pickup:', error);
      toast({
        title: "Completion Failed",
        description: "There was an error completing the pickup. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Mutation to resign from a job
  const resignJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      console.log('Resigning from job:', jobId);
      
      const { data, error } = await supabase
        .from('delivery_jobs')
        .update({
          liaison_id: null,
          status: 'available',
          assigned_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId)
        .in('status', ['assigned']) // Can only resign from assigned jobs, not in-progress
        .select('*');
        
      if (error) {
        console.error('Error resigning from job:', error);
        throw error;
      }
      
      // Decrement the liaison's job count
      if (liaisonId) {
        const { error: countError } = await supabase
          .from('company_liaisons')
          .update({ 
            current_job_count: Math.max((liaisonProfile?.current_job_count || 1) - 1, 0) 
          })
          .eq('id', liaisonId);
          
        if (countError) {
          console.error('Error decrementing liaison job count:', countError);
          // Don't throw, the resignation was successful
        }
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liaison', 'assignedJobs'] });
      queryClient.invalidateQueries({ queryKey: ['liaison', 'availableJobs'] });
      queryClient.invalidateQueries({ queryKey: ['liaison', 'profile'] });
      
      toast({
        title: "Job Resigned",
        description: "You have resigned from the job."
      });
    },
    onError: (error) => {
      console.error('Error resigning from job:', error);
      toast({
        title: "Resignation Failed",
        description: "There was an error resigning from the job. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Combine loading states
  const isLoading = isLoadingAvailable || isLoadingAssigned || isLoadingCompleted;

  // Expose the necessary data and functions
  return {
    availableJobs,
    assignedJobs,
    completedJobs,
    liaisonProfile,
    isLoading,
    acceptJob: acceptJobMutation.mutate,
    startDelivery: startDeliveryMutation.mutate,
    completeDelivery: completeDeliveryMutation.mutate,
    startPickup: startPickupMutation.mutate,
    completePickup: completePickupMutation.mutate,
    resignJob: resignJobMutation.mutate
  };
}
