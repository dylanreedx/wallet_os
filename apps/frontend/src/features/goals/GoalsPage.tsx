import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useGoals, useSharedGoals } from '@/hooks/useGoals';
import { GoalFormDialog } from './GoalFormDialog';
import { GoalCard } from './GoalCard';
import { GoalStats } from './GoalStats';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type RoleFilter = 'all' | 'viewer' | 'contributor' | 'owner';

const ROLE_BADGE_STYLES: Record<string, string> = {
  viewer: 'bg-slate-100 text-slate-700 border-slate-200',
  contributor: 'bg-blue-100 text-blue-700 border-blue-200',
  owner: 'bg-purple-100 text-purple-700 border-purple-200',
};

export default function GoalsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');

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
  
  // Map and sort shared goals by createdAt (most recent first)
  const collabGoals = useMemo(() => {
    const mapped = sharedGoals.map((entry: any) => ({
      goal: entry.goal,
      owner: entry.owner,
      sharedGoal: entry.sharedGoal,
    }));
    
    // Sort by shared date (most recent first)
    return mapped.sort((a, b) => {
      const dateA = new Date(a.sharedGoal?.createdAt || 0).getTime();
      const dateB = new Date(b.sharedGoal?.createdAt || 0).getTime();
      return dateB - dateA;
    });
  }, [sharedGoals]);

  // Filter shared goals by role
  const filteredCollabGoals = useMemo(() => {
    if (roleFilter === 'all') return collabGoals;
    return collabGoals.filter(
      (collab) => collab.sharedGoal?.role === roleFilter
    );
  }, [collabGoals, roleFilter]);

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
                      showShareButton
                      showManageButton
                      currentUserId={user?.id}
                    />
                  ))}
                </div>
              </div>
            )}

            {hasSharedGoals && (
              <div className="space-y-3">
                <div className="flex items-center justify-between pt-4">
                  <h2 className="text-xl font-semibold">Shared with You</h2>
                  <div className="flex items-center gap-3">
                    <Select
                      value={roleFilter}
                      onValueChange={(value) => setRoleFilter(value as RoleFilter)}
                    >
                      <SelectTrigger className="w-[130px] h-8 text-sm">
                        <SelectValue placeholder="Filter by role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All roles</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                        <SelectItem value="contributor">Contributor</SelectItem>
                        <SelectItem value="owner">Owner</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-sm text-muted-foreground">
                      {filteredCollabGoals.length} of {collabGoals.length}
                    </span>
                  </div>
                </div>
                <div className="space-y-4">
                  {filteredCollabGoals.length === 0 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      No shared goals with this role.
                    </div>
                  ) : (
                    filteredCollabGoals.map((collab) => {
                      const ownerName =
                        collab.owner?.name ||
                        collab.owner?.email ||
                        'Unknown Owner';
                      const role = collab.sharedGoal?.role || 'viewer';
                      const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
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
                          contextLabel={
                            <Badge
                              variant="outline"
                              className={`text-xs ${ROLE_BADGE_STYLES[role] || ''}`}
                            >
                              {roleLabel}
                            </Badge>
                          }
                          contextSubtext={`Owner: ${ownerName}`}
                        />
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
