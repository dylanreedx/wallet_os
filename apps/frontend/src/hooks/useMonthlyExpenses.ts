import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { monthlyExpenses as monthlyExpensesApi } from '@/lib/api';

interface UseMonthlyExpensesOptions {
  userId?: number;
  includeInactive?: boolean;
  enabled?: boolean;
}

export function useMonthlyExpenses({ 
  userId, 
  includeInactive = false, 
  enabled = true 
}: UseMonthlyExpensesOptions) {
  return useQuery({
    queryKey: ['monthly-expenses', userId, includeInactive],
    queryFn: () => monthlyExpensesApi.getAll(userId!, includeInactive),
    enabled: !!userId && enabled,
    placeholderData: (previousData) => previousData,
  });
}

export function useCreateMonthlyExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: monthlyExpensesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthly-expenses'] });
    },
  });
}

export function useUpdateMonthlyExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof monthlyExpensesApi.update>[1] }) =>
      monthlyExpensesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthly-expenses'] });
    },
  });
}
