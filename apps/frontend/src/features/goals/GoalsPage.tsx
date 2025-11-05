import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { goals } from '@/lib/api';
import { GoalFormDialog } from './GoalFormDialog';
import { GoalCard } from './GoalCard';
import { GoalStats } from './GoalStats';
import { Button } from '@/components/ui/button';

export default function GoalsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [goalsList, setGoalsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (user?.id) {
      loadGoals();
    }
  }, [user?.id, refreshTrigger]);

  const loadGoals = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const data = await goals.getAll(user.id);
      setGoalsList(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

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

        {goalsList.length > 0 && <GoalStats goalsList={goalsList} />}

        {goalsList.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <p className="text-muted-foreground">
              No goals yet. Create your first goal to get started!
            </p>
            <GoalFormDialog
              onSuccess={handleGoalCreated}
              trigger={<Button size="lg">Create Your First Goal</Button>}
            />
          </div>
        ) : (
          <div className="space-y-4">
            {goalsList.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onClick={() => navigate(`/goals/${goal.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
