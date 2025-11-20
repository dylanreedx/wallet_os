import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useExpenses, useUpdateExpense, useDeleteExpense, type Expense } from '@/hooks/useExpenses';
import { useMonthlyExpenses } from '@/hooks/useMonthlyExpenses';
import { format } from 'date-fns';
import { Loader2, Receipt, ArrowDown } from 'lucide-react';
import { ExpenseFiltersComponent, ExpenseFilters } from './ExpenseFilters';
import { EditExpenseDialog } from './EditExpenseDialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { DraggableExpenseItem } from './DraggableExpenseItem';
import { ExpensePlaceholder } from './ExpensePlaceholder';
import { ExpenseItem } from './ExpenseItem';



interface ExpenseListProps {
  refreshTrigger?: number;
  selectedCategory?: string | null;
}

const PULL_TO_REFRESH_THRESHOLD = 50; // pixels to pull before triggering refresh

// Device detection hook
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

export function ExpenseList({ refreshTrigger, selectedCategory }: ExpenseListProps) {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [filters, setFilters] = useState<ExpenseFilters>({
    category: null,
    startDate: null,
    endDate: null,
    searchQuery: '',
  });

  // TanStack Query hooks
  const { data: expenses = [], isLoading: loading, error: queryError, refetch } = useExpenses({
    userId: user?.id,
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
  });
  const updateExpenseMutation = useUpdateExpense();
  const deleteExpenseMutation = useDeleteExpense();

  const error = queryError ? (queryError as Error).message : null;

  // Sync external category selection with internal filters
  useEffect(() => {
    if (selectedCategory !== undefined) {
      setFilters((prev) => ({
        ...prev,
        category: selectedCategory,
      }));
    }
  }, [selectedCategory]);

  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleteConfirmExpense, setDeleteConfirmExpense] = useState<Expense | null>(null);

  // Fetch recurring expenses using TanStack Query
  const { data: recurringExpensesList = [] } = useMonthlyExpenses({
    userId: user?.id,
    includeInactive: false,
  });

  // Drag-and-drop state (both desktop and mobile)
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dragOverDateKey, setDragOverDateKey] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Pull-to-refresh state (mobile only)
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const touchStartY = useRef<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Configure sensors for drag and drop (BOTH DESKTOP AND MOBILE)
  // TouchSensor: Press-and-hold activation for mobile (500ms delay, stricter tolerance)
  // PointerSensor: Mouse drag for desktop (10px movement required)
  const sensors = useSensors(
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 500, // Press and hold for 500ms to activate drag (increased from 450ms)
        tolerance: 5, // Reduced tolerance - must hold position more accurately
      },
    }),
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10, // 10px movement required for desktop drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Haptic feedback helper
  const triggerHaptic = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  // Refetch when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger) {
      refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);



  // Apply client-side filters (category and search)
  const filteredExpenses = expenses.filter((expense: Expense) => {
    if (filters.category && expense.category !== filters.category) {
      return false;
    }

    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase();
      if (!expense.description.toLowerCase().includes(query)) {
        return false;
      }
    }

    return true;
  });

  // Extract date part from ISO string (YYYY-MM-DD) to avoid timezone issues
  const getDateKey = (dateString: string): string => {
    const match = dateString.match(/^(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : dateString.substring(0, 10);
  };

  // Group expenses by date and maintain order
  const groupedExpenses = filteredExpenses.reduce((groups: Record<string, Expense[]>, expense: Expense) => {
    const dateKey = getDateKey(expense.date);

    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(expense);
    return groups;
  }, {} as Record<string, Expense[]>);

  // ==================== DESKTOP: Drag-and-drop handlers ====================
  
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    triggerHaptic();
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      setDragOverDateKey(null);
      setDragOverIndex(null);
      return;
    }

    const draggedExpense = filteredExpenses.find(
      (e: Expense) => e.id.toString() === active.id
    );
    const targetExpense = filteredExpenses.find(
      (e: Expense) => e.id.toString() === over.id
    );

    if (!draggedExpense || !targetExpense) {
      setDragOverDateKey(null);
      setDragOverIndex(null);
      return;
    }

    const sourceDateKey = getDateKey(draggedExpense.date);
    const targetDateKey = getDateKey(targetExpense.date);

    if (sourceDateKey !== targetDateKey) {
      const targetDateExpenses: Expense[] = groupedExpenses[targetDateKey] || [];
      const targetIndex = targetDateExpenses.findIndex(
        (e: Expense) => e.id.toString() === over.id
      );

      if (targetIndex !== -1) {
        setDragOverDateKey(targetDateKey);
        setDragOverIndex(targetIndex);
      } else {
        setDragOverDateKey(null);
        setDragOverIndex(null);
      }
    } else {
      setDragOverDateKey(null);
      setDragOverIndex(null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setDragOverDateKey(null);
    setDragOverIndex(null);

    if (!over || active.id === over.id) {
      return;
    }

    let sourceDateKey: string | null = null;
    let targetDateKey: string | null = null;
    let sourceIndex = -1;
    let targetIndex = -1;

    for (const [dateKey, dateExpenses] of Object.entries(groupedExpenses)) {
      const sourceIdx = (dateExpenses as Expense[]).findIndex(
        (e: Expense) => e.id.toString() === active.id
      );
      const targetIdx = (dateExpenses as Expense[]).findIndex(
        (e: Expense) => e.id.toString() === over.id
      );

      if (sourceIdx !== -1) {
        sourceDateKey = dateKey;
        sourceIndex = sourceIdx;
      }
      if (targetIdx !== -1) {
        targetDateKey = dateKey;
        targetIndex = targetIdx;
      }
    }

    if (!sourceDateKey || !targetDateKey || sourceIndex === -1 || targetIndex === -1) {
      return;
    }

    const draggedExpense = expenses.find((e: Expense) => e.id.toString() === active.id);
    const targetExpense = expenses.find((e: Expense) => e.id.toString() === over.id);

    if (!draggedExpense || !targetExpense) {
      return;
    }

    // If dragging to a different date, update the expense date
    if (sourceDateKey !== targetDateKey) {
      try {
        const targetDate = new Date(targetExpense.date);
        await updateExpenseMutation.mutateAsync({
          id: draggedExpense.id,
          data: {
            date: targetDate.toISOString(),
          },
        });
      } catch (error) {
        console.error('Failed to update expense date:', error);
      }
    }
    // Note: Reordering within same date is optimistic UI only (no backend persistence)
  };

  // ==================== MOBILE: Pull-to-refresh handlers ====================

  const handleTouchStart = (e: React.TouchEvent) => {
    if (scrollContainerRef.current?.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null || loading) return;

    const touchY = e.touches[0].clientY;
    const deltaY = touchY - touchStartY.current;

    if (deltaY > 0 && scrollContainerRef.current?.scrollTop === 0) {
      setIsPulling(true);
      const distance = Math.min(deltaY, PULL_TO_REFRESH_THRESHOLD * 2);
      setPullDistance(distance);
    }
  };

  const handleTouchEnd = () => {
    if (isPulling && pullDistance >= PULL_TO_REFRESH_THRESHOLD) {
      refetch();
    }
    setPullDistance(0);
    setIsPulling(false);
    touchStartY.current = null;
  };

  // ==================== Common handlers ====================

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
  };

  const handleDelete = (id: number) => {
    const expense = expenses.find((e: any) => e.id === id);
    if (expense) {
      setDeleteConfirmExpense(expense);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirmExpense) return;

    try {
      await deleteExpenseMutation.mutateAsync(deleteConfirmExpense.id);
      setDeleteConfirmExpense(null);
    } catch (error) {
      console.error('Failed to delete expense:', error);
    }
  };

  const handleEditSuccess = async (updatedExpense: Expense) => {
    setEditingExpense(null);
    // TanStack Query will automatically refetch via cache invalidation
  };

  const formatDateLabel = (dateKey: string) => {
    const [year, month, day] = dateKey.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);

    if (dateOnly.getTime() === today.getTime()) {
      return 'Today';
    } else if (dateOnly.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    } else {
      return format(date, 'MMMM d, yyyy');
    }
  };

  const totalAmount = filteredExpenses.reduce(
    (sum: number, expense: Expense) => sum + expense.amount,
    0
  );

  const isRecurring = (expense: Expense) => {
    return recurringExpensesList.some(
      (recurring: any) =>
        recurring.name === expense.description &&
        Math.abs(recurring.amount - expense.amount) < 0.01 &&
        recurring.isActive
    );
  };

  // ==================== Render ====================

  if (loading && expenses.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && expenses.length === 0) {
    return (
      <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
        {error}
      </div>
    );
  }

  // Render expense items grouped by date
  const renderExpenseItems = () => {
    return Object.entries(groupedExpenses)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([dateKey, dateExpenses]) => (
        <div key={dateKey} className="mb-2 last:mb-0">
          {/* Date Header */}
          <div className="px-3 py-1.5 mb-1.5">
            <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              {formatDateLabel(dateKey)}
            </h3>
          </div>
          
          {/* Expense Items */}
          <div className="space-y-0">
            {(dateExpenses as Expense[]).map((expense: Expense, index: number) => {
              const showPlaceholderAt =
                dragOverDateKey === dateKey && dragOverIndex === index;
              
              return (
                <div key={expense.id}>
                  {showPlaceholderAt && <ExpensePlaceholder />}
                  <DraggableExpenseItem
                    expense={expense}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    isRecurring={isRecurring(expense)}
                  />
                </div>
              );
            })}
            {/* Show placeholder at end of list if dragging to last position */}
            {dragOverDateKey === dateKey &&
              dragOverIndex === (dateExpenses as Expense[]).length && (
                <ExpensePlaceholder />
              )}
          </div>
        </div>
      ));
  };

  return (
    <div className="space-y-3">
      {/* Filters */}
      <ExpenseFiltersComponent filters={filters} onFiltersChange={setFilters} />

      {/* Pull-to-refresh indicator (mobile only) */}
      {isMobile && isPulling && (
        <div
          className="flex items-center justify-center py-2 text-sm text-muted-foreground transition-opacity"
          style={{
            opacity: Math.min(pullDistance / PULL_TO_REFRESH_THRESHOLD, 1),
            transform: `translateY(${Math.min(
              pullDistance,
              PULL_TO_REFRESH_THRESHOLD
            )}px)`,
          }}
        >
          <ArrowDown
            className={`h-4 w-4 mr-2 transition-transform ${
              pullDistance >= PULL_TO_REFRESH_THRESHOLD ? 'rotate-180' : ''
            }`}
          />
          {pullDistance >= PULL_TO_REFRESH_THRESHOLD
            ? 'Release to refresh'
            : 'Pull to refresh'}
        </div>
      )}

      {/* Expense List */}
      {filteredExpenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {expenses.length === 0
              ? 'No expenses yet'
              : 'No expenses match your filters'}
          </p>
          {expenses.length === 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              Create your first expense to get started
            </p>
          )}
        </div>
      ) : (
        // Unified drag-and-drop support for both desktop and mobile
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={() => {
            setActiveId(null);
            setDragOverDateKey(null);
            setDragOverIndex(null);
          }}
          accessibility={{
            announcements: {
              onDragStart({ active }) {
                return `Picked up expense ${active.id}`;
              },
              onDragOver({ active, over }) {
                if (over) {
                  const draggedExpense = filteredExpenses.find(
                    (e: Expense) => e.id.toString() === active.id
                  );
                  const targetExpense = filteredExpenses.find(
                    (e: Expense) => e.id.toString() === over.id
                  );
                  if (draggedExpense && targetExpense) {
                    const sourceDateKey = getDateKey(draggedExpense.date);
                    const targetDateKey = getDateKey(targetExpense.date);
                    if (sourceDateKey !== targetDateKey) {
                      const targetDateLabel = formatDateLabel(targetDateKey);
                      return `Moving expense to ${targetDateLabel}`;
                    }
                  }
                  return `Moving expense ${active.id} over ${over.id}`;
                }
                return '';
              },
              onDragEnd({ active, over }) {
                if (over && active.id !== over.id) {
                  return `Moved expense ${active.id} to position of ${over.id}`;
                }
                return '';
              },
              onDragCancel({ active }) {
                return `Cancelled dragging expense ${active.id}`;
              },
            },
          }}
        >
          <div
            ref={scrollContainerRef}
            onTouchStart={isMobile ? handleTouchStart : undefined}
            onTouchMove={isMobile ? handleTouchMove : undefined}
            onTouchEnd={isMobile ? handleTouchEnd : undefined}
            className="border rounded-lg bg-card p-2 w-full"
          >
            <SortableContext
              items={filteredExpenses.map((e: Expense) => e.id.toString())}
              strategy={verticalListSortingStrategy}
            >
              {renderExpenseItems()}
            </SortableContext>

            {/* Total Footer */}
            <div className="mt-2 pt-2.5 px-3 pb-2 bg-muted/30 border-t rounded-b-lg">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {filteredExpenses.length === expenses.length
                    ? 'Total'
                    : `Total (${filteredExpenses.length} of ${expenses.length})`}
                </span>
                <span className="text-base font-bold tabular-nums text-foreground">
                  ${totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Drag Overlay */}
          <DragOverlay>
            {activeId ? (
              <div className="opacity-50">
                {(() => {
                  const expense = filteredExpenses.find(
                    (e: Expense) => e.id.toString() === activeId
                  );
                  if (!expense) return null;
                  return (
                    <DraggableExpenseItem
                      expense={expense}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      isRecurring={isRecurring(expense)}
                    />
                  );
                })()}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Edit Dialog */}
      <EditExpenseDialog
        expense={editingExpense}
        open={editingExpense !== null}
        onOpenChange={(open) => !open && setEditingExpense(null)}
        onSuccess={handleEditSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmExpense !== null}
        onOpenChange={(open) => !open && setDeleteConfirmExpense(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Expense</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this expense? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteConfirmExpense && (
            <div className="py-4">
              <p className="font-medium">{deleteConfirmExpense.description}</p>
              <p className="text-sm text-muted-foreground mt-1">
                ${deleteConfirmExpense.amount.toFixed(2)}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmExpense(null)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
