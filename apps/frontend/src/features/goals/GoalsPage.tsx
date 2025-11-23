import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useGoals, useSharedGoals } from '@/hooks/useGoals';
import { GoalFormDialog } from './GoalFormDialog';
import { GoalCard } from './GoalCard';
import { GoalStats } from './GoalStats';
import { Button } from '@/components/ui/button';

export default function GoalsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const {
    data: goalsList = [],
    isLoading: loadingGoals,
    error: goalsError,
  } = useGoals({
    userId: user?.id,
  });
  const {
    data: sharedGoalsRaw = [],
    isLoading: loadingShared,
    error: sharedError,
  } = useSharedGoals({
    userId: user?.id,
  });

  const sharedGoals = Array.isArray(sharedGoalsRaw) ? sharedGoalsRaw : [];
  const collabGoals = sharedGoals.map((entry: any) => ({
    goal: entry.goal,
    owner: entry.owner,
    sharedGoal: entry.sharedGoal,
  }));

  const loading = loadingGoals || loadingShared;
  const error = goalsError
    ? (goalsError as Error).message
    : sharedError
    ? (sharedError as Error).message
    : null;
  const hasPersonalGoals = goalsList.length > 0;
  const hasSharedGoals = collabGoals.length > 0;

  const handleGoalCreated = (goal: any) => {
    setRefreshTrigger((prev) => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen p-4 pb-24">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Goals</h1>
            <p className="text-muted-foreground">Manage your financial goals</p>
          </div>
          <div className="text-center py-12 text-muted-foreground">
            <p>Loading goals...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Goals</h1>
            <p className="text-muted-foreground">Manage your financial goals</p>
          </div>
          <GoalFormDialog onSuccess={handleGoalCreated} />
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {hasPersonalGoals && <GoalStats goalsList={goalsList} />}

        {!hasPersonalGoals && !hasSharedGoals ? (
          <div className="text-center py-12 space-y-4">
            <p className="text-muted-foreground">
              No goals yet. Create your first goal or accept an invite to get
              started!
            </p>
            <GoalFormDialog
              onSuccess={handleGoalCreated}
              trigger={<Button size="lg">Create Your First Goal</Button>}
            />
          </div>
        ) : (
          <>
            {hasPersonalGoals && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">My Goals</h2>
                  <span className="text-sm text-muted-foreground">
                    {goalsList.length} active
                  </span>
                </div>
                <div className="space-y-4">
                  {goalsList.map((goal: any) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      onClick={() => navigate(`/goals/${goal.id}`)}
                    />
                  ))}
                </div>
              </div>
            )}

            {hasSharedGoals && (
              <div className="space-y-3">
                <div className="flex items-center justify-between pt-4">
                  <h2 className="text-xl font-semibold">Shared with You</h2>
                  <span className="text-sm text-muted-foreground">
                    {collabGoals.length} collab
                  </span>
                </div>
                <div className="space-y-4">
                  {collabGoals.map((collab) => {
                    const ownerName =
                      collab.owner?.name ||
                      collab.owner?.email ||
                      'Unknown Owner';
                    const role =
                      collab.sharedGoal?.role === 'owner'
                        ? 'Owner'
                        : collab.sharedGoal?.role === 'contributor'
                        ? 'Contributor'
                        : 'Viewer';
                    const sharedKey =
                      collab.sharedGoal?.id ??
                      `shared-${collab.goal.id}-${
                        collab.sharedGoal?.userId ?? 'collab'
                      }`;

                    return (
                      <GoalCard
                        key={sharedKey}
                        goal={collab.goal}
                        onClick={() => navigate(`/goals/${collab.goal.id}`)}
                        contextLabel="Shared"
                        contextSubtext={`Owner: ${ownerName} • Role: ${role}`}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
