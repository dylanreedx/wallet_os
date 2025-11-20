import { useState, useEffect, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ExpenseItem } from './ExpenseItem';
import { cn } from '@/lib/utils';

interface Expense {
  id: number;
  userId: number;
  amount: number;
  description: string;
  category: string | null;
  color: string | null;
  date: string;
  goalId: number | null;
  goalItemId: number | null;
  createdAt: string;
}

interface DraggableExpenseItemProps {
  expense: Expense;
  onEdit: (expense: Expense) => void;
  onDelete: (id: number) => void;
  isRecurring?: boolean;
}

/**
 * Draggable expense item wrapper for both desktop and mobile
 * - Desktop: Mouse drag with PointerSensor
 * - Mobile: Press-and-hold activation with TouchSensor (450ms delay)
 * - Coordinates with swipe handlers in ExpenseItem to prevent conflicts
 */
export function DraggableExpenseItem({
  expense,
  onEdit,
  onDelete,
  isRecurring,
}: DraggableExpenseItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: expense.id.toString(),
  });

  // Track press duration for visual feedback
  const [isHolding, setIsHolding] = useState(false);
  const [isSwiping, setIsSwiping] = useState(false);
  const holdTimerRef = useRef<number | null>(null);
  const touchStartTimeRef = useRef<number | null>(null);

  // Handle touch start to track hold duration
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartTimeRef.current = Date.now();
    setIsHolding(true);

    // Show visual feedback after 300ms (before 500ms activation)
    holdTimerRef.current = window.setTimeout(() => {
      // Visual feedback that drag is about to activate
      if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }
    }, 300);
  };

  // Handle touch end to reset hold state
  const handleTouchEnd = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    setIsHolding(false);
    touchStartTimeRef.current = null;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
      }
    };
  }, []);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Conditionally apply listeners - disable when swiping
  // When swiping, we don't want drag listeners to interfere
  const dragListeners = isSwiping
    ? {} // Empty listeners when swiping - prevents drag activation
    : {
        ...listeners,
        onTouchStart: (e: React.TouchEvent) => {
          handleTouchStart(e);
          // Call original listener if it exists
          if (listeners?.onTouchStart) {
            listeners.onTouchStart(e);
          }
        },
        onTouchEnd: (e: React.TouchEvent) => {
          handleTouchEnd();
          // Call original listener if it exists
          if (listeners?.onTouchEnd) {
            listeners.onTouchEnd(e);
          }
        },
      };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
      }}
      {...attributes}
      {...dragListeners}
      className={cn(
        'cursor-grab active:cursor-grabbing select-none',
        'transition-transform duration-200',
        isHolding && !isDragging && 'scale-[1.02] opacity-90',
        isDragging && 'scale-105 opacity-70'
      )}
      onDragStart={(e) => e.preventDefault()} // Prevent native drag
      onContextMenu={(e) => e.preventDefault()} // Prevent context menu on long press
    >
      <ExpenseItem
        expense={expense}
        onEdit={onEdit}
        onDelete={onDelete}
        isRecurring={isRecurring}
        isDragging={isDragging}
        onSwipeStart={() => setIsSwiping(true)}
        onSwipeEnd={() => setIsSwiping(false)}
      />
    </div>
  );
}
