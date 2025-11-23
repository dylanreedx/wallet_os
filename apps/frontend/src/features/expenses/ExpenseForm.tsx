import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { expenses } from '@/lib/api';
import { brain } from '@/lib/ai';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useState, useEffect, useRef } from 'react';
import { goals, goalItems, monthlyExpenses } from '@/lib/api';
import { PriceInput } from './PriceInput';
import { DescriptionInput } from './DescriptionInput';
import { Sparkles, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

const expenseFormSchema = z.object({
  amount: z
    .number({
      required_error: 'Amount is required',
      invalid_type_error: 'Amount must be a number',
    })
    .positive('Amount must be greater than 0')
    .finite(),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(500, 'Description must be less than 500 characters'),
  category: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  goalId: z.string().optional(),
  goalItemId: z.string().optional(),
  isRecurring: z.boolean().optional(),
  visibility: z.enum(['private', 'friends', 'public']).optional(),
});

type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

interface ExpenseFormProps {
  onSubmit?: (expense: any) => void;
  onCancel?: () => void;
  defaultValues?: Partial<ExpenseFormValues>;
  expenseId?: number; // If provided, form will update instead of create
}

export function ExpenseForm({
  onSubmit,
  onCancel,
  defaultValues,
  expenseId,
}: ExpenseFormProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [goalsList, setGoalsList] = useState<any[]>([]);
  const [goalItemsList, setGoalItemsList] = useState<any[]>([]);
  const [isBrainThinking, setIsBrainThinking] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      amount: defaultValues?.amount || undefined,
      description: defaultValues?.description || '',
      category: defaultValues?.category || undefined,
      date: defaultValues?.date || format(new Date(), 'yyyy-MM-dd'),
      goalId: defaultValues?.goalId?.toString() || undefined,
      goalItemId: defaultValues?.goalItemId?.toString() || undefined,
      isRecurring: defaultValues?.isRecurring || false,
      visibility: defaultValues?.visibility || 'private',
    },
  });

  // Update form when defaultValues.isRecurring changes (e.g., when recurring status loads asynchronously)
  // Only update isRecurring field to avoid resetting user input
  useEffect(() => {
    if (defaultValues?.isRecurring !== undefined && expenseId) {
      form.setValue('isRecurring', defaultValues.isRecurring);
    }
  }, [defaultValues?.isRecurring, expenseId, form]);

  const selectedGoalId = form.watch('goalId');
  const description = form.watch('description');
  const amount = form.watch('amount');
  const date = form.watch('date');

  // AI Categorization Logic
  useEffect(() => {
    if (!description || description.length < 3) return;
    
    // Don't categorize if category is already set (unless it's "Uncategorized")
    const currentCategory = form.getValues('category');
    if (currentCategory && currentCategory !== 'Uncategorized' && expenseId) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      setIsBrainThinking(true);
      try {
        const result = await brain.categorize({
          description,
          amount: amount || 0,
          date: date || new Date().toISOString(),
        });
        
        if (result && result.category) {
          form.setValue('category', result.category);
        }
      } catch (error) {
        console.error('Brain failed to categorize:', error);
      } finally {
        setIsBrainThinking(false);
      }
    }, 1000); // 1 second debounce

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [description, amount, date, form, expenseId]);

  // Load goals
  useEffect(() => {
    if (user?.id) {
      goals.getAll(user.id).then((data) => {
        setGoalsList(Array.isArray(data) ? data : []);
      });
    }
  }, [user?.id]);

  // Load goal items when goal is selected OR when editing with existing goalId
  useEffect(() => {
    const goalIdToLoad =
      selectedGoalId && selectedGoalId !== 'none' ? selectedGoalId : null;

    if (goalIdToLoad) {
      goalItems
        .getAll(parseInt(goalIdToLoad))
        .then((data) => {
          setGoalItemsList(Array.isArray(data) ? data : []);
          // Only reset goal item selection if goal changed (not on initial load with existing goal)
          if (!defaultValues?.goalItemId) {
            form.setValue('goalItemId', undefined);
          }
        })
        .catch((err) => {
          console.error('Failed to load goal items:', err);
          setGoalItemsList([]);
        });
    } else {
      setGoalItemsList([]);
      // Don't reset if we're editing and have a goalItemId (goal was just deselected)
      if (!defaultValues?.goalItemId) {
        form.setValue('goalItemId', undefined);
      }
    }
  }, [selectedGoalId, form, defaultValues?.goalItemId]);

  // Load goal items on mount if editing with existing goalId
  useEffect(() => {
    if (defaultValues?.goalId && defaultValues.goalId !== 'none') {
      goalItems
        .getAll(parseInt(defaultValues.goalId))
        .then((data) => {
          setGoalItemsList(Array.isArray(data) ? data : []);
        })
        .catch((err) => {
          console.error('Failed to load goal items on mount:', err);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount - defaultValues.goalId is stable

  // Auto-focus first input when form is rendered (only on desktop)
  useEffect(() => {
    // Don't auto-focus on mobile to avoid triggering keyboard immediately
    const isMobile = window.innerWidth < 768;
    if (isMobile) return;

    const firstInput = document.querySelector<HTMLInputElement>(
      'input[type="number"]'
    );
    if (firstInput) {
      // Small delay to ensure dialog animation doesn't interfere
      setTimeout(() => firstInput.focus(), 100);
    }
  }, []);

  const handleSubmit = async (values: ExpenseFormValues) => {
    if (!user?.id) {
      setSubmitError('You must be logged in to manage expenses');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      let expense;
      const expenseData = {
        amount: values.amount,
        description: values.description,
        category: values.category || undefined,
        date: new Date(values.date).toISOString(),
        goalId:
          values.goalId && values.goalId !== 'none'
            ? parseInt(values.goalId)
            : undefined,
        goalItemId:
          values.goalItemId && values.goalItemId !== 'none'
            ? parseInt(values.goalItemId)
            : undefined,
        visibility: values.visibility,
      };

      if (expenseId) {
        // Get the original expense before updating to check if it was recurring
        const originalExpense = await expenses.get(expenseId);
        
        // Update existing expense
        expense = await expenses.update(expenseId, expenseData);
        // Fetch the updated expense to get full data
        expense = await expenses.get(expenseId);

        // Handle recurring expense updates
        if (user?.id) {
          try {
            const existingRecurring = await monthlyExpenses.getAll(user.id, false);
            
            // Find monthly expense that matched the OLD expense data
            const oldMatchingRecurring = existingRecurring.find(
              (recurring: any) =>
                recurring.name === originalExpense.description &&
                Math.abs(recurring.amount - originalExpense.amount) < 0.01 &&
                recurring.isActive
            );

            // Find monthly expense that matches the NEW expense data
            const newMatchingRecurring = existingRecurring.find(
              (recurring: any) =>
                recurring.name === values.description &&
                Math.abs(recurring.amount - values.amount) < 0.01 &&
                recurring.isActive
            );

            if (values.isRecurring) {
              // User wants this expense to be recurring
              if (oldMatchingRecurring && !newMatchingRecurring) {
                // Expense was recurring but description/amount changed
                // Update the monthly expense to match new values
                await monthlyExpenses.update(oldMatchingRecurring.id, {
                  name: values.description,
                  amount: values.amount,
                  category: values.category || undefined,
                });
              } else if (!oldMatchingRecurring && !newMatchingRecurring) {
                // Expense wasn't recurring, create new monthly expense
                await monthlyExpenses.create({
                  userId: user.id,
                  name: values.description,
                  amount: values.amount,
                  category: values.category || undefined,
                  description: `Recurring expense - created from expense entry`,
                  isActive: true,
                });
              }
              // If newMatchingRecurring exists, nothing to do - already matches
            } else {
              // User unchecked recurring
              if (oldMatchingRecurring) {
                // Expense was recurring, but now user doesn't want it to be
                // We could delete it, but for now we'll just deactivate it
                // This way it's preserved for future use but won't show as recurring
                await monthlyExpenses.update(oldMatchingRecurring.id, {
                  isActive: false,
                });
              }
            }
          } catch (error) {
            console.error('Failed to update recurring expense entry:', error);
            // Don't fail the whole operation if monthly expense update fails
          }
        }
      } else {
        // Create new expense
        expense = await expenses.create({
          userId: user.id,
          ...expenseData,
        });

        // If recurring, also create a monthly expense entry
        if (values.isRecurring) {
          try {
            await monthlyExpenses.create({
              userId: user.id,
              name: values.description,
              amount: values.amount,
              category: values.category || undefined,
              description: `Recurring expense - created from expense entry`,
              isActive: true,
            });
          } catch (error) {
            console.error('Failed to create recurring expense entry:', error);
            // Don't fail the whole operation if monthly expense creation fails
          }
        }
      }

      if (!expenseId) {
        form.reset();
      }
      onSubmit?.(expense);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : expenseId
          ? 'Failed to update expense'
          : 'Failed to create expense'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3 sm:space-y-4">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm sm:text-base font-semibold">Amount</FormLabel>
              <FormControl>
                <PriceInput
                  value={field.value}
                  onChange={field.onChange}
                  error={form.formState.errors.amount?.message}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm sm:text-base font-semibold">Description</FormLabel>
              <FormControl>
                <DescriptionInput
                  value={field.value}
                  onChange={field.onChange}
                  error={form.formState.errors.description?.message}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm sm:text-base font-semibold flex items-center gap-2">
                Category
                {isBrainThinking && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground animate-pulse">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    The Brain is thinking...
                  </span>
                )}
                {!isBrainThinking && field.value && (
                  <span className="flex items-center gap-1 text-xs text-primary">
                    <Sparkles className="h-3 w-3" />
                    Auto-detected
                  </span>
                )}
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    {...field}
                    placeholder="Auto-categorized by The Brain"
                    readOnly
                    className="bg-muted/50"
                  />
                  {/* Fallback manual override could go here later */}
                </div>
              </FormControl>
              <FormDescription>
                Automatically determined based on your description
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm sm:text-base font-semibold">Date</FormLabel>
              <FormControl>
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select date"
                />
              </FormControl>
              <FormDescription>When did this expense occur?</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="goalId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm sm:text-base font-semibold">Link to Goal (Optional)</FormLabel>
              <Select
                onValueChange={(value) => {
                  // "none" is our sentinel value, convert to undefined
                  field.onChange(value === 'none' ? undefined : value);
                }}
                value={field.value || 'none'}
              >
                <FormControl>
                  <SelectTrigger>
                  <SelectValue placeholder="None - just tracking expenses" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {goalsList.map((goal) => (
                    <SelectItem key={goal.id} value={goal.id.toString()}>
                      {goal.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Link this expense to a goal to track progress automatically
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedGoalId &&
          selectedGoalId !== 'none' &&
          goalItemsList.length > 0 && (
            <FormField
              control={form.control}
              name="goalItemId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm sm:text-base font-semibold">Link to Specific Item (Optional)</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      // "none" is our sentinel value, convert to undefined
                      field.onChange(value === 'none' ? undefined : value);
                    }}
                    value={field.value || 'none'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Just the goal, not a specific item" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Just the goal</SelectItem>
                      {goalItemsList.map((item) => (
                        <SelectItem key={item.id} value={item.id.toString()}>
                          {item.name} ($
                          {(item.price * item.quantity).toFixed(2)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Optionally link to a specific item from your goal
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

        <FormField
          control={form.control}
          name="isRecurring"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value || false}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="cursor-pointer font-normal">
                  Make this recurring
                </FormLabel>
                <FormDescription>
                  This expense will be added to your recurring monthly expenses
                  and can appear automatically in future months
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        {/* Visibility Toggle - New Social Feature */}
        <FormField
          control={form.control}
          name="visibility"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm sm:text-base font-semibold">Visibility</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value || 'private'}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="private">Private (Only me)</SelectItem>
                  <SelectItem value="friends">Friends (Visible to friends)</SelectItem>
                  <SelectItem value="public">Public (Visible to everyone)</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Control who can see this expense
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {submitError && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {submitError}
          </div>
        )}

        <div className="flex gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" className="flex-1" disabled={isSubmitting}>
            {isSubmitting
              ? expenseId
                ? 'Updating...'
                : 'Creating...'
              : expenseId
              ? 'Update Expense'
              : 'Create Expense'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
