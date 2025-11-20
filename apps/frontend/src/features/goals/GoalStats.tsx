import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useExpenses } from '@/hooks/useExpenses';
import {
  Target,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Link as LinkIcon,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Goal {
  id: number;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string | Date;
  description?: string | null;
  targetMonth?: string | null;
}



interface GoalStatsProps {
  goalsList: Goal[];
}

export function GoalStats({ goalsList }: GoalStatsProps) {
  const { user } = useAuth();

  // Fetch expenses using TanStack Query
  const { data: expensesData = [] } = useExpenses({
    userId: user?.id,
  });

  // Calculate linked expenses statistics
  const { linkedExpensesCount, goalsWithLinkedExpenses } = useMemo(() => {
    const linkedCount = expensesData.filter((e: any) => e.goalId !== null).length;
    const goalIdsWithExpenses = new Set(
      expensesData
        .filter((e: any) => e.goalId !== null)
        .map((e: any) => e.goalId as number)
    );
    return {
      linkedExpensesCount: linkedCount,
      goalsWithLinkedExpenses: goalIdsWithExpenses.size,
    };
  }, [expensesData]);

  // Calculate statistics
  const totalGoals = goalsList.length;
  const completedGoals = goalsList.filter(
    (goal) =>
      goal.targetAmount > 0 &&
      (goal.currentAmount / goal.targetAmount) * 100 >= 100
  ).length;
  const activeGoals = totalGoals - completedGoals;
  const totalAmountSpent = goalsList.reduce(
    (sum, goal) => sum + goal.currentAmount,
    0
  );
  const totalTargetAmount = goalsList.reduce(
    (sum, goal) => sum + goal.targetAmount,
    0
  );
  const averageCompletion =
    totalGoals > 0
      ? goalsList.reduce((sum, goal) => {
          const progress =
            goal.targetAmount > 0
              ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
              : 0;
          return sum + progress;
        }, 0) / totalGoals
      : 0;


  if (totalGoals === 0) {
    return null; // Don't show stats if no goals
  }

  const stats: Array<{
    label: string;
    value: string;
    subtitle?: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bgColor: string;
  }> = [
    {
      label: 'Total Goals',
      value: totalGoals.toString(),
      icon: Target,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Completed',
      value: completedGoals.toString(),
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Active',
      value: activeGoals.toString(),
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      label: 'Total Spent',
      value: `$${totalAmountSpent.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      label: 'Avg Completion',
      value: `${averageCompletion.toFixed(1)}%`,
      icon: Clock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      label: 'Linked Expenses',
      value: linkedExpensesCount.toString(),
      subtitle: `${goalsWithLinkedExpenses} goals with expenses`,
      icon: LinkIcon,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Goal Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className={cn(
                    'flex flex-col items-center justify-center p-4 rounded-lg border transition-all hover:shadow-md',
                    stat.bgColor
                  )}
                >
                  <Icon className={cn('h-6 w-6 mb-2', stat.color)} />
                  <div className="text-2xl font-bold mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground text-center">
                    {stat.label}
                  </div>
                  {stat.subtitle && (
                    <div className="text-xs text-muted-foreground text-center mt-1">
                      {stat.subtitle}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Additional insights */}
          <div className="mt-6 pt-6 border-t space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Target Amount</span>
              <span className="font-semibold">
                ${totalTargetAmount.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Remaining</span>
              <span className="font-semibold">
                $
                {Math.max(0, totalTargetAmount - totalAmountSpent).toLocaleString(
                  'en-US',
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }
                )}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className="font-semibold">
                {totalTargetAmount > 0
                  ? `${(
                      (totalAmountSpent / totalTargetAmount) *
                      100
                    ).toFixed(1)}%`
                  : '0%'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

