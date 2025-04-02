
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

export function useLiaisonDashboard(userId?: string) {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Query to get the liaison ID from user ID
  const { data: liaisonData } = useQuery({
    queryKey: ['liaisonData', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('company_liaisons')
        .select('*')
        .eq('user_id', userId)
        .single();
        
      if (error) {
        console.error('Error fetching liaison data:', error);
        throw error;
      }
      
      return data;
    },
    enabled: !!userId
  });

  // Query to fetch available jobs for assignments
  const { data: availableJobs, isLoading: isLoadingAvailableJobs } = useQuery({
    queryKey: ['availableJobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_jobs')
        .select(`
          id,
          job_type,
          status,
          created_at,
          reservation:reservation_id(
            id,
            users:user_id(id, email, full_name, phone_number),
            start_zone:start_zone_id(id, zone_name, coordinates),
            end_zone:end_zone_id(id, zone_name, coordinates),
            status
          )
        `)
        .eq('status', 'available')
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching available jobs:', error);
        throw error;
      }
      
      return data || [];
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Query to fetch assigned jobs for this liaison
  const { data: assignedJobs, isLoading: isLoadingAssignedJobs } = useQuery({
    queryKey: ['assignedJobs', liaisonData?.id, filterStatus],
    queryFn: async () => {
      if (!liaisonData?.id) return [];
      
      let query = supabase
        .from('delivery_jobs')
        .select(`
          id,
          job_type,
          status,
          created_at,
          assigned_at,
          completed_at,
          reservation:reservation_id(
            id,
            users:user_id(id, email, full_name, phone_number),
            status,
            start_zone:start_zone_id(id, zone_name, coordinates),
            end_zone:end_zone_id(id, zone_name, coordinates)
          )
        `)
        .eq('liaison_id', liaisonData.id)
        .order('created_at', { ascending: false });
        
      // Apply status filter if not 'all'
      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }
      
      const { data, error } = await query;
        
      if (error) {
        console.error('Error fetching assigned jobs:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!liaisonData?.id,
    refetchInterval: 10000 // Refresh every 10 seconds
  });

  // Mutation to accept a job
  const acceptJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      if (!liaisonData?.id) throw new Error('Liaison ID not found');
      
      // Call the RPC function to atomically assign the job
      const { data, error } = await supabase
        .rpc('assign_delivery_job', { 
          job_id: jobId,
          assign_to_liaison_id: liaisonData.id
        });
      
      if (error) {
        console.error('Error accepting job:', error);
        throw error;
      }
      
      if (!data.success) {
        throw new Error(data.message);
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availableJobs'] });
      queryClient.invalidateQueries({ queryKey: ['assignedJobs'] });
      queryClient.invalidateQueries({ queryKey: ['liaisonData'] });
      
      toast({
        title: "Job Accepted",
        description: "The job has been assigned to you successfully."
      });
    },
    onError: (error: any) => {
      console.error('Error accepting job:', error);
      toast({
        title: "Assignment Failed",
        description: error.message || "There was an error accepting the job. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Mutation to update job status
  const updateJobStatusMutation = useMutation({
    mutationFn: async ({ jobId, newStatus, reservationUpdate = null }: 
      { jobId: string, newStatus: string, reservationUpdate?: { status: string, id: string } | null }) => {
      if (!liaisonData?.id) throw new Error('Liaison ID not found');
      
      // Start a transaction for job status update
      const updatePromises = [];
      
      // Update job status
      updatePromises.push(
        supabase
          .from('delivery_jobs')
          .update({ 
            status: newStatus,
            updated_at: new Date().toISOString(),
            completed_at: newStatus === 'completed' ? new Date().toISOString() : undefined
          })
          .eq('id', jobId)
          .eq('liaison_id', liaisonData.id)
      );
      
      // If there's a reservation update, include it
      if (reservationUpdate) {
        updatePromises.push(
          supabase
            .from('reservations')
            .update({ 
              status: reservationUpdate.status,
              updated_at: new Date().toISOString()
            })
            .eq('id', reservationUpdate.id)
        );
      }
      
      // Execute all updates
      const results = await Promise.all(updatePromises);
      
      // Check for errors
      for (const { error } of results) {
        if (error) throw error;
      }
      
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignedJobs'] });
      queryClient.invalidateQueries({ queryKey: ['liaisonData'] });
      
      toast({
        title: "Status Updated",
        description: "The job status has been updated successfully."
      });
    },
    onError: (error: any) => {
      console.error('Error updating job status:', error);
      toast({
        title: "Update Failed",
        description: error.message || "There was an error updating the job status. Please try again.",
        variant: "destructive"
      });
    }
  });

  return {
    liaisonData,
    availableJobs,
    assignedJobs,
    isLoadingAvailableJobs,
    isLoadingAssignedJobs,
    filterStatus,
    setFilterStatus,
    acceptJobMutation,
    updateJobStatusMutation
  };
}
