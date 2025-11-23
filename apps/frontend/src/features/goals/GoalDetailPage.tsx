import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { goals, goalItems, expenses } from '@/lib/api';
import { GoalFormDialog } from './GoalFormDialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { ArrowLeft, Edit, Trash2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { GoalChat } from './GoalChat';

export default function GoalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [goal, setGoal] = useState<any>(null);
  const [goalItemsList, setGoalItemsList] = useState<any[]>([]);
  const [linkedExpenses, setLinkedExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (id && user?.id) {
      loadGoalData();
    }
  }, [id, user?.id]);

  const loadGoalData = async () => {
    if (!id || !user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const [goalData, itemsData] = await Promise.all([
        goals.get(parseInt(id)),
        goalItems.getAll(parseInt(id)),
      ]);

      setGoal(goalData);
      setGoalItemsList(Array.isArray(itemsData) ? itemsData : []);

      // Load linked expenses
      const allExpenses = await expenses.getAll(user.id);
      const linked = Array.isArray(allExpenses)
        ? allExpenses.filter((e: any) => e.goalId === parseInt(id))
        : [];
      setLinkedExpenses(linked);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load goal');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePurchased = async (
    itemId: number,
    currentlyPurchased: boolean
  ) => {
    if (!id) return;

    try {
      await goalItems.update(parseInt(id), itemId, {
        purchased: !currentlyPurchased,
      });

      // Reload goal data to update progress
      await loadGoalData();
    } catch (err) {
      console.error('Failed to update item:', err);
    }
  };

  const handleDeleteGoal = async () => {
    if (!id) return;

    setIsDeleting(true);
    try {
      await goals.delete(parseInt(id));
      navigate('/goals');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete goal');
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleGoalUpdated = () => {
    loadGoalData();
  };

  if (loading) {
    return (
      <div className="min-h-screen p-4 pb-24">
        <div className="max-w-4xl mx-auto">
          <p className="text-muted-foreground">Loading goal...</p>
        </div>
      </div>
    );
  }

  if (error || !goal) {
    return (
      <div className="min-h-screen p-4 pb-24">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate('/goals')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Goals
          </Button>
          <div className="text-destructive">{error || 'Goal not found'}</div>
        </div>
      </div>
    );
  }

  const progress =
    goal.targetAmount > 0
      ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
      : 0;

  const daysRemaining = Math.ceil(
    (new Date(goal.deadline).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
  );
  const isCompleted = progress >= 100;
  const isOverdue = daysRemaining < 0;

  return (
    <div className="min-h-screen p-4 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/goals')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1" />
          <GoalFormDialog
            goalId={goal.id}
            defaultValues={{
              name: goal.name,
              description: goal.description,
              deadline: format(new Date(goal.deadline), 'yyyy-MM-dd'),
              targetMonth: goal.targetMonth,
            }}
            onSuccess={handleGoalUpdated}
            title="Edit Goal"
            description="Update your goal details"
            trigger={
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            }
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeleteDialogOpen(true)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>

        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <h1 className="text-3xl font-bold">{goal.name}</h1>
              {goal.description && (
                <p className="text-muted-foreground mt-2">{goal.description}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{progress.toFixed(1)}%</span>
              </div>

              <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                <div
                  className={cn(
                    'h-full transition-all duration-300 rounded-full',
                    isCompleted
                      ? 'bg-green-500'
                      : isOverdue
                      ? 'bg-red-500'
                      : 'bg-primary'
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <div>
                  <span className="text-muted-foreground">Spent: </span>
                  <span className="font-medium">
                    ${goal.currentAmount.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Target: </span>
                  <span className="font-medium">
                    ${goal.targetAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                <span>
                  Deadline: {format(new Date(goal.deadline), 'MMM dd, yyyy')}
                </span>
                <span
                  className={cn(
                    'font-medium',
                    isOverdue && 'text-red-500',
                    !isOverdue && daysRemaining <= 7 && 'text-orange-500',
                    isCompleted && 'text-green-500'
                  )}
                >
                  {isCompleted
                    ? 'Completed! 🎉'
                    : isOverdue
                    ? `${Math.abs(daysRemaining)} days overdue`
                    : daysRemaining === 0
                    ? 'Due today'
                    : `${daysRemaining} days left`}
                </span>
              </div>
            </div>
          </div>
        </Card>

        <div>
          <h2 className="text-xl font-semibold mb-4">What you need</h2>
          <div className="space-y-2">
            {goalItemsList.length === 0 ? (
              <Card className="p-4 text-center text-muted-foreground">
                No items added yet
              </Card>
            ) : (
              goalItemsList.map((item) => {
                const itemTotal = item.price * item.quantity;
                const isPurchased = item.purchased;
                const linkedExpense = linkedExpenses.find(
                  (e: any) => e.goalItemId === item.id
                );

                return (
                  <Card
                    key={item.id}
                    className={cn(
                      'p-4 transition-all',
                      isPurchased && 'bg-muted/50'
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              handleTogglePurchased(item.id, isPurchased)
                            }
                            className={cn(
                              'w-5 h-5 rounded border-2 flex items-center justify-center transition-all',
                              isPurchased
                                ? 'bg-primary border-primary text-primary-foreground'
                                : 'border-muted-foreground/30 hover:border-primary'
                            )}
                          >
                            {isPurchased && <Check className="h-3 w-3" />}
                          </button>
                          <div>
                            <h3
                              className={cn(
                                'font-medium',
                                isPurchased &&
                                  'line-through text-muted-foreground'
                              )}
                            >
                              {item.name}
                            </h3>
                            {item.quantity > 1 && (
                              <p className="text-xs text-muted-foreground">
                                Quantity: {item.quantity}
                              </p>
                            )}
                            {linkedExpense && (
                              <p className="text-xs text-green-600 mt-1">
                                Linked to expense: {linkedExpense.description}{' '}
                                (${linkedExpense.amount.toFixed(2)})
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${itemTotal.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">
                          ${item.price.toFixed(2)}{' '}
                          {item.quantity > 1 && `× ${item.quantity}`}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>

        {linkedExpenses.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Linked Expenses</h2>
            <div className="space-y-2">
              {linkedExpenses.map((expense: any) => (
                <Card key={expense.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{expense.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(expense.date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <p className="font-medium">${expense.amount.toFixed(2)}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8">
          <GoalChat goalId={goal.id} />
        </div>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Goal</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{goal.name}"? This action cannot
              be undone. All linked expenses will be unlinked but not deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteGoal}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
