import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Goal, GoalFormData } from '../types';

export const useGoals = (getAuthHeader: () => Record<string, string>) => {
  const queryClient = useQueryClient();
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalFormData, setGoalFormData] = useState<GoalFormData>({ 
    id: null, name: '', target_amount: '', saved_amount: 0, deadline: '', icon: 'Target', status: 'Active' 
  });

  const { data: goals = [], isLoading: isLoadingGoals } = useQuery<Goal[]>({
    queryKey: ['goals'], 
    queryFn: async () => { 
      const res = await fetch('/api/goals', { headers: getAuthHeader() }); 
      const json = await res.json(); 
      return json.data || []; 
    }
  });

  const submitGoal = useMutation({
    mutationFn: async (payload: { id: number | null, data: Omit<Goal, 'id'> }) => {
      const isEdit = payload.id !== null;
      const res = await fetch(isEdit ? `/api/goals/${payload.id}` : '/api/goals', { 
        method: isEdit ? 'PUT' : 'POST', 
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() }, 
        body: JSON.stringify(payload.data) 
      });
      return await res.json();
    },
    onSuccess: () => {
      setIsGoalModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    }
  });

  const updateGoalProgress = useMutation({
    mutationFn: async (payload: { id: number, data: Goal }) => {
      const res = await fetch(`/api/goals/${payload.id}`, { 
        method: 'PUT', headers: { 'Content-Type': 'application/json', ...getAuthHeader() }, 
        body: JSON.stringify(payload.data) 
      });
      return await res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] })
  });

  const deleteGoal = useMutation({
    mutationFn: async (id: number) => { 
      const res = await fetch(`/api/goals/${id}`, { method: 'DELETE', headers: getAuthHeader() }); 
      return await res.json(); 
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] })
  });

  return {
    goals,
    isLoadingGoals,
    isGoalModalOpen,
    setIsGoalModalOpen,
    goalFormData,
    setGoalFormData,
    submitGoal,
    updateGoalProgress,
    deleteGoal
  };
};