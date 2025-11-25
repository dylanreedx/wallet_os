import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { goals, goalItems, expenses, social } from '@/lib/api';
import { useDeleteGoal } from '@/hooks/useGoals';
import { useUpdateGoalItem } from '@/hooks/useGoalItems';
import { GoalFormDialog } from './GoalFormDialog';
import { ShareGoalDialog } from './ShareGoalDialog';
import { ManageCollaboratorsDialog } from './ManageCollaboratorsDialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { ArrowLeft, Edit, Trash2, Check, Users, Share2, Settings } from 'lucide-react';
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

type Role = 'viewer' | 'contributor' | 'owner';

const ROLE_BADGE_STYLES: Record<Role, string> = {
  viewer: 'bg-slate-100 text-slate-700 border-slate-200',
  contributor: 'bg-blue-100 text-blue-700 border-blue-200',
  owner: 'bg-purple-100 text-purple-700 border-purple-200',
};

interface Collaborator {
  sharedGoal: {
    id: number;
    userId: number;
    role: Role;
  };
  user: {
    id: number;
    name: string | null;
    email: string;
  };
}

export default function GoalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const deleteGoalMutation = useDeleteGoal();
  const updateGoalItemMutation = useUpdateGoalItem();
  const [goal, setGoal] = useState<any>(null);
  const [goalItemsList, setGoalItemsList] = useState<any[]>([]);
  const [linkedExpenses, setLinkedExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch collaborators for this goal
  const { data: collaborators = [], refetch: refetchCollaborators } = useQuery<Collaborator[]>({
    queryKey: ['goal-users', id ? parseInt(id) : 0],
    queryFn: () => (id ? social.getGoalUsers(parseInt(id)) : Promise.resolve([])),
    enabled: !!id,
  });

  // Fetch contributions for this goal
  const { data: contributions } = useQuery<{
    expenses: any[];
    summary: { userId: number; name: string | null; email: string; total: number; count: number }[];
    totalContributed: number;
  }>({
    queryKey: ['goal-contributions', id ? parseInt(id) : 0],
    queryFn: () => (id ? goals.getContributions(parseInt(id)) : Promise.resolve({ expenses: [], summary: [], totalContributed: 0 })),
    enabled: !!id && collaborators.length > 0, // Only fetch if there are collaborators
  });

  // Determine user's role and permissions
  const isOwner = goal?.userId === user?.id;
  const userCollaboration = collaborators.find((c) => c.user.id === user?.id);
  const userRole: Role | null = isOwner ? 'owner' : userCollaboration?.sharedGoal.role || null;
  const canEdit = userRole === 'owner' || userRole === 'contributor';
  const canDelete = isOwner; // Only the actual owner can delete
  const canManage = isOwner; // Only owner can manage collaborators

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
    if (!id || !canEdit) return;

    try {
      // Use mutation for proper query invalidation
      await updateGoalItemMutation.mutateAsync({
        goalId: parseInt(id),
        itemId,
        data: { purchased: !currentlyPurchased },
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
      // Use mutation for proper query invalidation
      await deleteGoalMutation.mutateAsync(parseInt(id));
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
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="ghost" size="sm" onClick={() => navigate('/goals')} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0" />
          
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {/* Role badge for shared goals */}
            {userRole && !isOwner && (
              <Badge
                variant="outline"
                className={`text-xs shrink-0 ${ROLE_BADGE_STYLES[userRole]}`}
              >
                {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
              </Badge>
            )}
            
            {/* Share button (owner only) */}
            {canManage && (
              <ShareGoalDialog
                goalId={goal.id}
                goalName={goal.name}
                onSuccess={() => refetchCollaborators()}
                trigger={
                  <Button variant="outline" size="sm" className="shrink-0">
                    <Share2 className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Share</span>
                  </Button>
                }
              />
            )}
            
            {/* Manage collaborators (owner only) */}
            {canManage && collaborators.length > 0 && (
              <ManageCollaboratorsDialog
                goalId={goal.id}
                goalName={goal.name}
                onUpdate={() => refetchCollaborators()}
                trigger={
                  <Button variant="outline" size="sm" className="shrink-0">
                    <Settings className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Manage</span>
                  </Button>
                }
              />
            )}
            
            {/* Edit button (owner/contributor) */}
            {canEdit && (
              <GoalFormDialog
                goalId={goal.id}
                defaultValues={{
                  name: goal.name,
                  description: goal.description,
                  deadline: goal.deadline.substring(0, 10),
                  targetMonth: goal.targetMonth,
                }}
                onSuccess={handleGoalUpdated}
                title="Edit Goal"
                description="Update your goal details"
                trigger={
                  <Button variant="outline" size="sm" className="shrink-0">
                    <Edit className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Edit</span>
                  </Button>
                }
              />
            )}
            
            {/* Delete button (owner only) */}
            {canDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
                className="text-destructive hover:text-destructive shrink-0"
              >
                <Trash2 className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Delete</span>
              </Button>
            )}
          </div>
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
                  Deadline: {format(new Date(goal.deadline.substring(0, 10) + 'T12:00:00'), 'MMM dd, yyyy')}
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

        {/* Collaborators Section */}
        {collaborators.length > 0 && (
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium">Collaborators</h3>
              </div>
              <span className="text-xs text-muted-foreground">
                {collaborators.length} {collaborators.length === 1 ? 'person' : 'people'}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {collaborators.map((collab) => (
                <div
                  key={collab.user.id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-full bg-muted/50"
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={`https://avatar.vercel.sh/${collab.user.email}`} />
                    <AvatarFallback className="text-xs">
                      {collab.user.name?.[0] || collab.user.email[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium">
                    {collab.user.name || collab.user.email.split('@')[0]}
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 ${ROLE_BADGE_STYLES[collab.sharedGoal.role]}`}
                  >
                    {collab.sharedGoal.role}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Contributions Summary Section */}
        {contributions && contributions.summary.length > 0 && (
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium">Contribution Summary</h3>
              <span className="text-xs text-muted-foreground">
                ${contributions.totalContributed.toFixed(2)} total
              </span>
            </div>
            <div className="space-y-3">
              {contributions.summary.map((contributor) => {
                const percentage = contributions.totalContributed > 0
                  ? (contributor.total / contributions.totalContributed) * 100
                  : 0;
                return (
                  <div key={contributor.userId} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={`https://avatar.vercel.sh/${contributor.email}`} />
                          <AvatarFallback className="text-xs">
                            {contributor.name?.[0] || contributor.email[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">
                          {contributor.name || contributor.email.split('@')[0]}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium">${contributor.total.toFixed(2)}</span>
                        <span className="text-xs text-muted-foreground ml-1">
                          ({percentage.toFixed(0)}%)
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {contributor.count} expense{contributor.count !== 1 ? 's' : ''}
                    </p>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

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
                            disabled={!canEdit}
                            className={cn(
                              'w-5 h-5 rounded border-2 flex items-center justify-center transition-all',
                              isPurchased
                                ? 'bg-primary border-primary text-primary-foreground'
                                : 'border-muted-foreground/30 hover:border-primary',
                              !canEdit && 'cursor-not-allowed opacity-50'
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
                        {format(new Date(expense.date.substring(0, 10) + 'T12:00:00'), 'MMM dd, yyyy')}
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
