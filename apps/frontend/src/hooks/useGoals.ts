import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { goals as goalsApi } from '@/lib/api';

export interface Goal {
  id: number;
  userId: number;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  targetMonth: string | null;
  description: string | null;
  createdAt: string;
}

interface UseGoalsOptions {
  userId?: number;
  enabled?: boolean;
}

export function useGoals({ userId, enabled = true }: UseGoalsOptions) {
  return useQuery({
    queryKey: ['goals', userId],
    queryFn: () => goalsApi.getAll(userId!),
    enabled: !!userId && enabled,
    placeholderData: (previousData) => previousData,
  });
}

export function useGoal(id?: number) {
  return useQuery({
    queryKey: ['goals', id],
    queryFn: () => goalsApi.get(id!),
    enabled: !!id,
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: goalsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof goalsApi.update>[1] }) =>
      goalsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: goalsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}
