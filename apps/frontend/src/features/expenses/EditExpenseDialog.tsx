import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ExpenseForm } from './ExpenseForm';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { monthlyExpenses } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Expense {
  id: number;
  userId: number;
  amount: number;
  description: string;
  category: string | null;
  date: string;
  goalId: number | null;
  goalItemId: number | null;
  createdAt: string;
}

interface EditExpenseDialogProps {
  expense: Expense | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (expense: any) => void;
}

export function EditExpenseDialog({
  expense,
  open,
  onOpenChange,
  onSuccess,
}: EditExpenseDialogProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recurringExpenses, setRecurringExpenses] = useState<any[]>([]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [loadingRecurring, setLoadingRecurring] = useState(true);

  // Load recurring expenses to check if this expense is recurring
  useEffect(() => {
    const loadRecurring = async () => {
      if (!user?.id || !expense) {
        setLoadingRecurring(false);
        return;
      }

      try {
        const data = await monthlyExpenses.getAll(user.id, false);
        const recurringList = Array.isArray(data) ? data : [];
        setRecurringExpenses(recurringList);

        // Check if this expense matches a recurring monthly expense
        const matches = recurringList.some(
          (recurring) =>
            recurring.name === expense.description &&
            Math.abs(recurring.amount - expense.amount) < 0.01 &&
            recurring.isActive
        );
        setIsRecurring(matches);
      } catch (err) {
        console.error('Failed to load recurring expenses:', err);
      } finally {
        setLoadingRecurring(false);
      }
    };

    if (open && expense) {
      loadRecurring();
    }
  }, [user?.id, expense, open]);

  const handleSuccess = (updatedExpense: any) => {
    onOpenChange(false);
    onSuccess?.(updatedExpense);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  if (!expense) return null;

  // Format date for input (YYYY-MM-DD)
  const formattedDate = format(new Date(expense.date), 'yyyy-MM-dd');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'max-h-[90vh] overflow-y-auto',
          'sm:max-w-lg',
          // Mobile bottom sheet style - override default positioning
          'bottom-0 left-0 right-0 top-auto translate-y-0 translate-x-0',
          'sm:bottom-auto sm:left-[50%] sm:right-auto sm:top-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%]',
          'rounded-t-2xl rounded-b-none sm:rounded-lg',
          'border-b-0 sm:border-b',
          // Mobile slide animations
          'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
          'sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:zoom-in-95'
        )}
        onInteractOutside={(e) => {
          // Prevent closing the dialog when clicking inside a popover (like date picker)
          const target = e.target as HTMLElement;
          // Check both the target and the event's composed path for popover content
          const composedPath = e.composedPath() as HTMLElement[];
          const isInsidePopover =
            target.closest('[data-slot="popover-content"]') ||
            composedPath.some(
              (el) =>
                el?.hasAttribute?.('data-slot') &&
                el.getAttribute('data-slot') === 'popover-content'
            );

          if (isInsidePopover) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Edit Expense</DialogTitle>
          <DialogDescription>
            Update the details of your expense.
          </DialogDescription>
        </DialogHeader>
        <ExpenseForm
          onSubmit={handleSuccess}
          onCancel={handleCancel}
          expenseId={expense.id}
          defaultValues={{
            amount: expense.amount,
            description: expense.description,
            category: expense.category || undefined,
            date: formattedDate,
            goalId: expense.goalId?.toString() || undefined,
            goalItemId: expense.goalItemId?.toString() || undefined,
            isRecurring: isRecurring,
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
