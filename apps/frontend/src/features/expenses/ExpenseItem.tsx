import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Edit, Repeat } from 'lucide-react';
import { cn } from '@/lib/utils';

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

interface ExpenseItemProps {
  expense: Expense;
  onEdit: (expense: Expense) => void;
  onDelete: (id: number) => void;
  isRecurring?: boolean;
  isDragging?: boolean;
}

const SWIPE_THRESHOLD = 100; // pixels to swipe before revealing delete

export function ExpenseItem({ expense, onEdit, onDelete, isRecurring, isDragging }: ExpenseItemProps) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    // Don't allow swipe if dragging
    if (isDragging) return;
    
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // Don't allow swipe if dragging
    if (isDragging) return;
    
    if (touchStartX.current === null || touchStartY.current === null) return;

    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;

    const deltaX = touchStartX.current - touchX;
    const deltaY = Math.abs(touchStartY.current - touchY);

    // Only allow horizontal swipe if vertical movement is minimal
    if (deltaY < 20 && deltaX > 0) {
      // Swiping left (negative deltaX means left)
      const newOffset = Math.max(-SWIPE_THRESHOLD, -deltaX);
      setSwipeOffset(newOffset);
    }
  };

  const handleTouchEnd = () => {
    if (swipeOffset <= -SWIPE_THRESHOLD * 0.5) {
      // Swiped enough to reveal delete
      setSwipeOffset(-SWIPE_THRESHOLD);
    } else {
      // Snap back
      setSwipeOffset(0);
    }
    setIsSwiping(false);
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const handleDelete = () => {
    onDelete(expense.id);
    setSwipeOffset(0);
  };

  const handleEdit = () => {
    onEdit(expense);
    setSwipeOffset(0);
  };

  // Reset swipe when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setSwipeOffset(0);
      }
    };

    if (swipeOffset < 0) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [swipeOffset]);

  return (
    <div className="relative overflow-hidden">
      {/* Delete Action Background */}
      <div
        className={cn(
          'absolute right-0 top-0 bottom-0 flex items-center justify-end pr-4 bg-destructive transition-all duration-200',
          swipeOffset < 0 ? 'opacity-100' : 'opacity-0'
        )}
        style={{ width: `${Math.abs(swipeOffset)}px` }}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          className="text-destructive-foreground hover:bg-destructive/80"
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </div>

      {/* Expense Card - Compact Jira-style */}
      <Card
        ref={cardRef}
        className={cn(
          'transition-transform duration-200 ease-out relative z-10 group',
          isSwiping && 'transition-none',
          'hover:shadow-sm border-border/50',
          isDragging && 'pointer-events-none' // Disable interactions when dragging
        )}
        style={{
          transform: `translateX(${swipeOffset}px)`,
        }}
        onTouchStart={isDragging ? undefined : handleTouchStart}
        onTouchMove={isDragging ? undefined : handleTouchMove}
        onTouchEnd={isDragging ? undefined : handleTouchEnd}
      >
        <CardContent className="p-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0 flex items-center gap-2">
              {isRecurring && (
                <Repeat className="h-3.5 w-3.5 text-primary shrink-0" title="Recurring expense" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={cn(
                    "text-sm font-medium text-foreground truncate",
                    isRecurring && "text-primary"
                  )}>
                    {expense.description}
                  </p>
                  {expense.category && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                      {expense.category}
                    </span>
                  )}
                  {isRecurring && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0">
                      Recurring
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <p className="font-semibold text-base tabular-nums">
                ${expense.amount.toFixed(2)}
              </p>
              <div className="flex gap-0.5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleEdit}
                  aria-label="Edit expense"
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={handleDelete}
                  aria-label="Delete expense"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
