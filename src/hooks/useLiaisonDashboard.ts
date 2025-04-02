
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
      }
    };
    
    fetchLiaisonId();
  }, [user]);

  // Query available jobs
  const { data: availableJobsData, isLoading: isAvailableLoading, refetch: refetchAvailableJobs } = useQuery({
    queryKey: ['availableJobs'],
    queryFn: async () => {
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
      
      // Call the database function to assign the job atomically
      const { data, error } = await supabase
        .rpc('assign_delivery_job', {
          job_id: jobId,
          assign_to_liaison_id: liaisonId
        });
        
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Refetch both queries to update UI
      refetchAvailableJobs();
      refetchAssignedJobs();
      
      toast({
        title: 'Job Accepted',
        description: 'You have successfully accepted this job',
      });
    },
    onError: (error: any) => {
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
      const { data, error } = await supabase
        .from('delivery_jobs')
        .update({ 
          status,
          ...(status === 'in_progress' ? {} : (status === 'completed' ? { completed_at: new Date().toISOString() } : {}))
        })
        .eq('id', jobId)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      refetchAssignedJobs();
      refetchAvailableJobs();
    },
    onError: (error: any) => {
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
      const { data, error } = await supabase
        .from('reservations')
        .update({ status })
        .eq('id', reservationId)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Refetch to ensure all data is up to date
      refetchAssignedJobs();
      refetchAvailableJobs();
    },
    onError: (error: any) => {
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
      // Get the job details first
      const { data: jobData, error: jobError } = await supabase
        .from('delivery_jobs')
        .select('*')
        .eq('id', jobId)
        .single();
        
      if (jobError) throw jobError;
      
      // Update the job status to available and remove liaison assignment
      const { error } = await supabase
        .from('delivery_jobs')
        .update({ 
          status: 'available',
          liaison_id: null
        })
        .eq('id', jobId);
        
      if (error) throw error;
      
      // Update the liaison's job count
      if (liaisonId) {
        const { error: updateError } = await supabase
          .from('company_liaisons')
          .update({ 
            current_job_count: supabase.rpc('greatest', { a: 0, b: -1 })
          })
          .eq('id', liaisonId);
          
        if (updateError) throw updateError;
      }
      
      refetchAssignedJobs();
      refetchAvailableJobs();
      
      toast({
        title: 'Job Resigned',
        description: 'You have resigned from this job',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to resign job',
        variant: 'destructive',
      });
    }
  };

  // Function to accept a job
  const acceptJob = (jobId: string) => {
    acceptJobMutation.mutate(jobId);
  };

  // Function to start delivery
  const startDelivery = async (jobId: string) => {
    try {
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
      const { data: jobData } = await supabase
        .from('delivery_jobs')
        .select('reservation_id')
        .eq('id', jobId)
        .single();
        
      if (!jobData) throw new Error('Job not found');
      
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
      refetchAssignedJobs();
      refetchAvailableJobs();
    } catch (error) {
      console.error('Error completing delivery:', error);
    }
  };

  // Function to start pickup
  const startPickup = async (jobId: string) => {
    try {
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
      const { data: jobData } = await supabase
        .from('delivery_jobs')
        .select('reservation_id')
        .eq('id', jobId)
        .single();
        
      if (!jobData) throw new Error('Job not found');
      
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
      refetchAssignedJobs();
      refetchAvailableJobs();
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
