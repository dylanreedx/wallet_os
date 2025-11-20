import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { budget as budgetApi } from '@/lib/api';

interface UseBudgetAnalysisOptions {
  userId?: number;
  month?: string;
  enabled?: boolean;
}

export function useBudgetAnalysis({ userId, month, enabled = true }: UseBudgetAnalysisOptions) {
  return useQuery({
    queryKey: ['budget', 'analysis', userId, month],
    queryFn: () => budgetApi.analyze(userId!, month),
    enabled: !!userId && enabled,
    placeholderData: (previousData) => previousData,
  });
}

export function useBudgetSuggestions({ userId, month, enabled = true }: UseBudgetAnalysisOptions) {
  return useQuery({
    queryKey: ['budget', 'suggestions', userId, month],
    queryFn: () => budgetApi.getSuggestions(userId!, month),
    enabled: !!userId && enabled,
    placeholderData: (previousData) => previousData,
  });
}

export function useAnalyzeBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, month }: { userId: number; month?: string }) =>
      budgetApi.analyze(userId, month),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['budget', 'analysis', variables.userId, variables.month] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['budget', 'suggestions', variables.userId, variables.month] 
      });
    },
  });
}
