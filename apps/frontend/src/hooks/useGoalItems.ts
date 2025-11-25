import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { goalItems as goalItemsApi } from '@/lib/api';

export interface GoalItem {
  id: number;
  goalId: number;
  name: string;
  price: number;
  quantity: number;
  purchased: boolean;
  createdAt: string;
}

interface UseGoalItemsOptions {
  goalId?: number;
  enabled?: boolean;
}

export function useGoalItems({ goalId, enabled = true }: UseGoalItemsOptions) {
  return useQuery({
    queryKey: ['goalItems', goalId],
    queryFn: () => goalItemsApi.getAll(goalId!),
    enabled: !!goalId && enabled,
    placeholderData: (previousData) => previousData,
  });
}

export function useCreateGoalItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      goalId,
      data,
    }: {
      goalId: number;
      data: { name: string; price: number; quantity?: number };
    }) => goalItemsApi.create(goalId, data),
    onSuccess: (_, variables) => {
      // Invalidate the specific goal's items
      queryClient.invalidateQueries({ queryKey: ['goalItems', variables.goalId] });
      // Also invalidate goals list since total might change
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}

export function useUpdateGoalItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      goalId,
      itemId,
      data,
    }: {
      goalId: number;
      itemId: number;
      data: { name?: string; price?: number; quantity?: number; purchased?: boolean };
    }) => goalItemsApi.update(goalId, itemId, data),
    onSuccess: (_, variables) => {
      // Invalidate the specific goal's items
      queryClient.invalidateQueries({ queryKey: ['goalItems', variables.goalId] });
      // Also invalidate goals list since progress might change
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}

export function useDeleteGoalItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ goalId, itemId }: { goalId: number; itemId: number }) =>
      goalItemsApi.delete(goalId, itemId),
    onSuccess: (_, variables) => {
      // Invalidate the specific goal's items
      queryClient.invalidateQueries({ queryKey: ['goalItems', variables.goalId] });
      // Also invalidate goals list since total might change
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}

