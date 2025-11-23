import { useEffect, useRef, createContext, useContext, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ExpenseItem } from './ExpenseItem';
import { cn } from '@/lib/utils';

export interface DragStateValue {
  activeId: string | null;
  originDateKey: string | null;
  originIndex: number | null;
}

export const DragStateContext = createContext<DragStateValue>({
  activeId: null,
  originDateKey: null,
  originIndex: null,
});

export const useDragState = () => useContext(DragStateContext);

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
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: expense.id.toString(),
  });

  const dragState = useDragState();
  const isActiveDrag = dragState.activeId === expense.id.toString();
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? -1 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        touchAction: 'manipulation',
      }}
      {...attributes}
      className={cn(
        'transition-all duration-200',
        isDragging && 'scale-105 opacity-70'
      )}
    >
      {isDragging ? (
        <div className="w-full h-[72px] rounded-lg border-2 border-dashed border-primary/20 bg-primary/5 p-3 flex items-center gap-3 animate-pulse">
          <div className="h-8 w-8 rounded-full bg-primary/10" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-24 bg-primary/10 rounded" />
            <div className="h-3 w-16 bg-primary/5 rounded" />
          </div>
          <div className="h-4 w-12 bg-primary/10 rounded" />
        </div>
      ) : (
          <ExpenseItem
            expense={expense}
            onEdit={onEdit}
            onDelete={onDelete}
            isRecurring={isRecurring}
            isDragging={isDragging}
            isAnyItemDragging={Boolean(dragState.activeId)}
            isDragOrigin={isActiveDrag}
            dragHandleProps={{
              ...listeners,
              ref: setActivatorNodeRef,
            }}
          />
      )}
    </div>
  );
}
