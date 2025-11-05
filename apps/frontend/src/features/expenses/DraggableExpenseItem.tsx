import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ExpenseItem } from './ExpenseItem';

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

interface DraggableExpenseItemProps {
  expense: Expense;
  onEdit: (expense: Expense) => void;
  onDelete: (id: number) => void;
  isRecurring?: boolean;
}

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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing touch-none"
      aria-label={`Drag to reorder expense: ${expense.description}`}
      tabIndex={0}
    >
      <ExpenseItem
        expense={expense}
        onEdit={onEdit}
        onDelete={onDelete}
        isRecurring={isRecurring}
        isDragging={isDragging}
      />
    </div>
  );
}

