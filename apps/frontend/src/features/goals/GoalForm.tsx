import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { goals, goalItems, social } from '@/lib/api';
import { useFriends } from '@/hooks/useFriends';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const goalItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  price: z
    .number({
      required_error: 'Price is required',
      invalid_type_error: 'Price must be a number',
    })
    .positive('Price must be greater than 0')
    .finite(),
  quantity: z
    .number()
    .int('Quantity must be a whole number')
    .positive('Quantity must be at least 1')
    .default(1),
});

const goalFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Goal name is required')
    .max(200, 'Name must be less than 200 characters'),
  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
  deadline: z.string().min(1, 'Deadline is required'),
  targetMonth: z.string().optional(),
  items: z
    .array(goalItemSchema)
    .min(1, 'At least one thing is needed')
    .refine(
      (items) => {
        const total = items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );
        return total > 0;
      },
      { message: 'Total goal amount must be greater than 0' }
    ),

  sharedWith: z.array(z.number()).optional(),
});

type GoalFormValues = z.infer<typeof goalFormSchema>;

interface GoalFormProps {
  onSubmit?: (goal: any) => void;
  onCancel?: () => void;
  defaultValues?: Partial<GoalFormValues>;
  goalId?: number; // If provided, form will update instead of create
}

export function GoalForm({
  onSubmit,
  onCancel,
  defaultValues,
  goalId,
}: GoalFormProps) {
  const { user } = useAuth();
  const { friends } = useFriends();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema) as any,
    defaultValues: {
      name: defaultValues?.name || '',
      description: defaultValues?.description || '',
      deadline: defaultValues?.deadline || format(new Date(), 'yyyy-MM-dd'),
      targetMonth: defaultValues?.targetMonth || undefined,
      items: defaultValues?.items || [
        { name: '', price: undefined as any, quantity: 1 },
      ],
      sharedWith: [],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control as any,
    name: 'items',
  });

  // Load existing items when editing
  useEffect(() => {
    if (goalId) {
      const loadItems = async () => {
        try {
          const items = await goalItems.getAll(goalId);
          if (Array.isArray(items) && items.length > 0) {
            replace(
              items.map((item) => ({
                name: item.name,
                price: item.price,
                quantity: item.quantity || 1,
              }))
            );
          }
        } catch (err) {
          console.error('Failed to load goal items:', err);
        }
      };
      loadItems();
    }
  }, [goalId, replace]);

  // Calculate total from items
  const watchedItems = form.watch('items');
  const totalAmount = watchedItems.reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
    0
  );

  // Auto-set targetMonth from deadline
  const deadline = form.watch('deadline');
  const targetMonth = deadline
    ? format(new Date(deadline), 'yyyy-MM')
    : undefined;

  const handleSubmit = async (values: GoalFormValues) => {
    if (!user?.id) {
      setSubmitError('You must be logged in to manage goals');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      let goal;
      const targetAmount = values.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      if (goalId) {
        // Update existing goal
        goal = await goals.update(goalId, {
          name: values.name,
          targetAmount,
          deadline: new Date(values.deadline).toISOString(),
          targetMonth: targetMonth,
          description: values.description || undefined,
        });

        // Update goal items (delete all and recreate)
        const existingItems = await goalItems.getAll(goalId);
        for (const item of existingItems) {
          await goalItems.delete(goalId, item.id);
        }
        for (const item of values.items) {
          await goalItems.create(goalId, {
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          });
        }

        goal = await goals.get(goalId);
      } else {
        // Create new goal
        goal = await goals.create({
          userId: user.id,
          name: values.name,
          targetAmount,
          deadline: new Date(values.deadline).toISOString(),
          targetMonth: targetMonth,
          description: values.description || undefined,
        });

        // Create goal items
        for (const item of values.items) {
          await goalItems.create(goal.id, {
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          });
        }

        // Fetch complete goal with items
        goal = await goals.get(goal.id);
      }

      if (!goalId) {
        form.reset({
          name: '',
          description: '',
          deadline: format(new Date(), 'yyyy-MM-dd'),
          targetMonth: undefined,
          items: [{ name: '', price: undefined, quantity: 1 }],
        });
        // Share with selected friends
        if (values.sharedWith && values.sharedWith.length > 0) {
          for (const friendId of values.sharedWith) {
            try {
              await social.shareGoal(goal.id, friendId, 'contributor');
            } catch (err) {
              console.error(`Failed to share with friend ${friendId}`, err);
            }
          }
        }

        form.reset({
          name: '',
          description: '',
          deadline: format(new Date(), 'yyyy-MM-dd'),
          targetMonth: undefined,
          items: [{ name: '', price: undefined, quantity: 1 }],
          sharedWith: [],
        });
      }
      onSubmit?.(goal);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : goalId
          ? 'Failed to update goal'
          : 'Failed to create goal'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control as any}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Goal Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., New Laptop, Vacation Fund"
                  {...field}
                />
              </FormControl>
              <FormDescription>What are you planning to buy?</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control as any}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Additional details about this goal..."
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormDescription>Optional notes about your goal</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control as any}
          name="deadline"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Deadline</FormLabel>
              <FormControl>
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select deadline"
                />
              </FormControl>
              <FormDescription>
                When do you want to reach this goal?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium">What do you need?</h3>
              <p className="text-sm text-muted-foreground">
                Break down what you need to buy
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({ name: '', price: undefined, quantity: 1 })
              }
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className={cn('p-4 border rounded-lg space-y-3', 'bg-card')}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <FormField
                      control={form.control as any}
                      name={`items.${index}.name`}
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                          <FormLabel className="text-xs">What?</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Flight, Hotel, Food"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control as any}
                      name={`items.${index}.price`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Price</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              onChange={(e) => {
                                const value = e.target.value;
                                field.onChange(
                                  value === '' ? undefined : parseFloat(value)
                                );
                              }}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control as any}
                      name={`items.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Quantity</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              step="1"
                              placeholder="1"
                              {...field}
                              onChange={(e) => {
                                const value = e.target.value;
                                field.onChange(
                                  value === '' ? undefined : parseInt(value, 10)
                                );
                              }}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                      className="mt-6 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {watchedItems[index]?.price &&
                  watchedItems[index]?.quantity && (
                    <p className="text-xs text-muted-foreground">
                      Subtotal: $
                      {(
                        watchedItems[index].price * watchedItems[index].quantity
                      ).toFixed(2)}
                    </p>
                  )}
              </div>
            ))}
          </div>

          {form.formState.errors.items && (
            <p className="text-sm text-destructive">
              {form.formState.errors.items.message}
            </p>
          )}

          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total Goal Amount</span>
              <span className="text-lg font-bold">
                ${totalAmount.toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              This will be set as your target amount
            </p>
          </div>

        </div>

        {friends.length > 0 && (
          <FormField
            control={form.control as any}
            name="sharedWith"
            render={() => (
              <FormItem>
                <div className="mb-4">
                  <FormLabel className="text-base">Share with Friends</FormLabel>
                  <FormDescription>
                    Select friends to collaborate on this goal.
                  </FormDescription>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {friends.map((friend: any) => (
                    <FormField
                      key={friend.id}
                      control={form.control as any}
                      name="sharedWith"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={friend.id}
                            className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(friend.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...(field.value || []), friend.id])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value: number) => value !== friend.id
                                        )
                                      );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer w-full">
                              {friend.name || friend.email}
                            </FormLabel>
                          </FormItem>
                        );
                      }}
                    />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

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
              ? goalId
                ? 'Updating...'
                : 'Creating...'
              : goalId
              ? 'Update Goal'
              : 'Create Goal'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
