import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface GoalCardProps {
  goal: {
    id: number;
    name: string;
    targetAmount: number;
    currentAmount: number;
    deadline: string | Date;
    description?: string | null;
    targetMonth?: string | null;
  };
  onClick?: () => void;
  contextLabel?: string;
  contextSubtext?: string;
}

export function GoalCard({
  goal,
  onClick,
  contextLabel,
  contextSubtext,
}: GoalCardProps) {
  const progress =
    goal.targetAmount > 0
      ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
      : 0;

  const daysRemaining = Math.ceil(
    (new Date(goal.deadline).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const isOverdue = daysRemaining < 0;
  const isCompleted = progress >= 100;

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md',
        onClick && 'hover:scale-[1.01]'
      )}
      onClick={onClick}
    >
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{goal.name}</h3>
            {goal.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {goal.description}
              </p>
            )}
          </div>
          {contextLabel && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary whitespace-nowrap">
              {contextLabel}
            </span>
          )}
        </div>

        {contextSubtext && (
          <p className="text-xs text-muted-foreground">{contextSubtext}</p>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{progress.toFixed(1)}%</span>
          </div>

          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
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

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Deadline: {format(new Date((typeof goal.deadline === 'string' ? goal.deadline.substring(0, 10) : goal.deadline.toISOString().substring(0, 10)) + 'T12:00:00'), 'MMM dd, yyyy')}
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
  );
}
