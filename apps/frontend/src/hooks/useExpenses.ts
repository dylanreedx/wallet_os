import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expenses as expensesApi } from '@/lib/api';

export interface Expense {
  id: number;
  userId: number;
  amount: number;
  description: string;
  category: string | null;
  color: string | null;
  date: string;
  goalId: number | null;
  goalItemId: number | null;
  createdAt: string;
}

interface UseExpensesOptions {
  userId?: number;
  startDate?: string;
  endDate?: string;
  enabled?: boolean;
}

export function useExpenses({ userId, startDate, endDate, enabled = true }: UseExpensesOptions) {
  return useQuery({
    queryKey: ['expenses', userId, startDate, endDate],
    queryFn: () => expensesApi.getAll(userId!, startDate, endDate),
    enabled: !!userId && enabled,
    placeholderData: (previousData) => previousData, // Keep previous data while refetching
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: expensesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-expenses'] }); // In case it affects recurring
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof expensesApi.update>[1] }) =>
      expensesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-expenses'] });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: expensesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-expenses'] });
    },
  });
}
