import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { expenses as expensesApi, monthlyExpenses } from '@/lib/api';
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
// Note: @dnd-kit/modifiers may need to be installed separately
// For now, we'll implement restrictions manually if needed
import { DraggableExpenseItem } from './DraggableExpenseItem';
import { ExpensePlaceholder } from './ExpensePlaceholder';

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

interface ExpenseListProps {
  refreshTrigger?: number;
}

const PULL_TO_REFRESH_THRESHOLD = 50; // pixels to pull before triggering refresh

export function ExpenseList({ refreshTrigger }: ExpenseListProps) {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ExpenseFilters>({
    category: null,
    startDate: null,
    endDate: null,
    searchQuery: '',
  });
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleteConfirmExpense, setDeleteConfirmExpense] =
    useState<Expense | null>(null);
  const [recurringExpensesList, setRecurringExpensesList] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  
  // Drag over state for cross-date placeholder
  const [dragOverDateKey, setDragOverDateKey] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Pull-to-refresh state
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const touchStartY = useRef<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Configure sensors for drag and drop (mobile + keyboard)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before activating (prevents accidental drags)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 300, // 300ms long-press on mobile
        tolerance: 5, // 5px movement tolerance
      },
    })
  );

  // Haptic feedback helper (if available)
  const triggerHaptic = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10); // Short vibration
    }
  };

  const fetchExpenses = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Build date range params if filters are set
      const startDate = filters.startDate || undefined;
      const endDate = filters.endDate || undefined;

      const data = await expensesApi.getAll(user.id, startDate, endDate);
      setExpenses(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, refreshTrigger, filters.startDate, filters.endDate]);

  // Load recurring expenses to check which expenses are recurring
  useEffect(() => {
    const loadRecurring = async () => {
      if (!user?.id) return;
      try {
        const data = await monthlyExpenses.getAll(user.id, false);
        setRecurringExpensesList(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load recurring expenses:', err);
      }
    };
    loadRecurring();
  }, [user?.id, refreshTrigger]);

  // Apply client-side filters (category and search)
  const filteredExpenses = expenses.filter((expense) => {
    // Category filter
    if (filters.category && expense.category !== filters.category) {
      return false;
    }

    // Search filter
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
    // Extract YYYY-MM-DD from ISO string (works with both "2025-11-02T00:00:00.000Z" and "2025-11-02")
    const match = dateString.match(/^(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : dateString.substring(0, 10);
  };

  // Group expenses by date and maintain order
  const groupedExpenses = filteredExpenses.reduce((groups, expense) => {
    const dateKey = getDateKey(expense.date);

    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(expense);
    return groups;
  }, {} as Record<string, Expense[]>);

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    triggerHaptic();
  };

  // Handle drag over - track position for placeholder
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      setDragOverDateKey(null);
      setDragOverIndex(null);
      return;
    }

    // Find the dragged expense and target expense
    const draggedExpense = filteredExpenses.find(
      (e) => e.id.toString() === active.id
    );
    const targetExpense = filteredExpenses.find(
      (e) => e.id.toString() === over.id
    );

    if (!draggedExpense || !targetExpense) {
      setDragOverDateKey(null);
      setDragOverIndex(null);
      return;
    }

    const sourceDateKey = getDateKey(draggedExpense.date);
    const targetDateKey = getDateKey(targetExpense.date);

    // Only show placeholder when dragging to a different date group
    if (sourceDateKey !== targetDateKey) {
      // Find the index of the target expense within its date group
      const targetDateExpenses = groupedExpenses[targetDateKey] || [];
      const targetIndex = targetDateExpenses.findIndex(
        (e) => e.id.toString() === over.id
      );

      if (targetIndex !== -1) {
        setDragOverDateKey(targetDateKey);
        setDragOverIndex(targetIndex);
      } else {
        setDragOverDateKey(null);
        setDragOverIndex(null);
      }
    } else {
      // Same date group - no placeholder needed
      setDragOverDateKey(null);
      setDragOverIndex(null);
    }
  };

  // Handle drag end - supports cross-date dragging
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    // Clear drag over state
    setDragOverDateKey(null);
    setDragOverIndex(null);

    if (!over || active.id === over.id) {
      return;
    }

    // Find which date group contains the dragged item and target
    let sourceDateKey: string | null = null;
    let targetDateKey: string | null = null;
    let sourceIndex = -1;
    let targetIndex = -1;

    for (const [dateKey, dateExpenses] of Object.entries(groupedExpenses)) {
      const sourceIdx = dateExpenses.findIndex(
        (e) => e.id.toString() === active.id
      );
      const targetIdx = dateExpenses.findIndex(
        (e) => e.id.toString() === over.id
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

    const draggedExpense = expenses.find((e) => e.id.toString() === active.id);
    const targetExpense = expenses.find((e) => e.id.toString() === over.id);

    if (!draggedExpense || !targetExpense) {
      return;
    }

    // If dragging to a different date, update the expense date
    if (sourceDateKey !== targetDateKey) {
      try {
        // Update the expense date to match the target date
        const targetDate = new Date(targetExpense.date);
        await expensesApi.update(draggedExpense.id, {
          ...draggedExpense,
          date: targetDate.toISOString(),
        });
        
        // Refresh expenses to reflect the date change
        await fetchExpenses();
      } catch (error) {
        console.error('Failed to update expense date:', error);
        setError('Failed to move expense to new date');
      }
    } else {
      // Reorder within the same date group
      const newOrder = arrayMove(groupedExpenses[sourceDateKey], sourceIndex, targetIndex);
      const newExpenses = [...expenses];
      
      // Update the order in the main expenses array
      const dateExpenses = newExpenses.filter((e) => getDateKey(e.date) === sourceDateKey);
      const otherExpenses = newExpenses.filter((e) => getDateKey(e.date) !== sourceDateKey);
      
      // Reorder date expenses
      const reorderedDateExpenses = arrayMove(dateExpenses, sourceIndex, targetIndex);
      
      // Combine and maintain overall order
      const allExpenses = [...otherExpenses, ...reorderedDateExpenses];
      allExpenses.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (dateA !== dateB) return dateB - dateA; // Descending by date
        // Within same date, maintain the new order
        const aIndex = reorderedDateExpenses.findIndex((e) => e.id === a.id);
        const bIndex = reorderedDateExpenses.findIndex((e) => e.id === b.id);
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        return 0;
      });
      
      setExpenses(allExpenses);
    }
  };

  const formatDateLabel = (dateKey: string) => {
    // Parse the dateKey (YYYY-MM-DD) as a local date to preserve the intended date
    const [year, month, day] = dateKey.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Compare dates at midnight
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);

    if (dateOnly.getTime() === today.getTime()) {
      return 'Today';
    } else if (dateOnly.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    } else {
      // Format the date for display
      return format(date, 'MMMM d, yyyy');
    }
  };

  // Calculate totals
  const totalAmount = filteredExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  // Pull-to-refresh handlers
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
      fetchExpenses();
    }
    setPullDistance(0);
    setIsPulling(false);
    touchStartY.current = null;
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
  };

  const handleDelete = (id: number) => {
    const expense = expenses.find((e) => e.id === id);
    if (expense) {
      setDeleteConfirmExpense(expense);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirmExpense) return;

    try {
      await expensesApi.delete(deleteConfirmExpense.id);
      setExpenses((prev) =>
        prev.filter((e) => e.id !== deleteConfirmExpense.id)
      );
      setDeleteConfirmExpense(null);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to delete expense'
      );
    }
  };

  const handleEditSuccess = async (updatedExpense: Expense) => {
    setExpenses((prev) =>
      prev.map((e) => (e.id === updatedExpense.id ? updatedExpense : e))
    );
    setEditingExpense(null);
    
    // Reload monthly expenses to recalculate recurring status
    if (user?.id) {
      try {
        const data = await monthlyExpenses.getAll(user.id, false);
        setRecurringExpensesList(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to reload recurring expenses:', err);
      }
    }
  };

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

  return (
    <div className="space-y-6">
      {/* Filters */}
      <ExpenseFiltersComponent filters={filters} onFiltersChange={setFilters} />

      {/* Pull-to-refresh indicator */}
      {isPulling && (
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
          // modifiers={[restrictToVerticalAxis, restrictToParentElement]} // Install @dnd-kit/modifiers if needed
          accessibility={{
            announcements: {
              onDragStart({ active }) {
                return `Picked up expense ${active.id}`;
              },
              onDragOver({ active, over }) {
                if (over) {
                  const draggedExpense = filteredExpenses.find(
                    (e) => e.id.toString() === active.id
                  );
                  const targetExpense = filteredExpenses.find(
                    (e) => e.id.toString() === over.id
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
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="space-y-2"
          >
            <SortableContext
              items={filteredExpenses.map((e) => e.id.toString())}
              strategy={verticalListSortingStrategy}
            >
              {Object.entries(groupedExpenses)
                .sort(([a], [b]) => b.localeCompare(a)) // Sort dates descending
                .map(([dateKey, dateExpenses]) => {
                  return (
                    <div key={dateKey} className="space-y-1">
                      <h3 className="text-xs font-medium text-muted-foreground px-2 uppercase tracking-wide">
                        {formatDateLabel(dateKey)}
                      </h3>
                      <div className="space-y-0.5">
                        {dateExpenses.map((expense, index) => {
                          // Check if this expense matches a recurring monthly expense
                          const isRecurring = recurringExpensesList.some(
                            (recurring) =>
                              recurring.name === expense.description &&
                              Math.abs(recurring.amount - expense.amount) < 0.01 &&
                              recurring.isActive
                          );
                          
                          // Show placeholder at this expense's position if dragging to this position
                          const showPlaceholderAt =
                            dragOverDateKey === dateKey && dragOverIndex === index;
                          
                          return (
                            <div key={expense.id}>
                              {showPlaceholderAt ? (
                                <ExpensePlaceholder />
                              ) : (
                                <DraggableExpenseItem
                                  expense={expense}
                                  onEdit={handleEdit}
                                  onDelete={handleDelete}
                                  isRecurring={isRecurring}
                                />
                              )}
                            </div>
                          );
                        })}
                        {/* Show placeholder at end of list if dragging to last position */}
                        {dragOverDateKey === dateKey &&
                          dragOverIndex === dateExpenses.length && (
                            <ExpensePlaceholder />
                          )}
                      </div>
                    </div>
                  );
                })}
            </SortableContext>

            {/* Total */}
            <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t pt-3 mt-4">
              <div className="flex items-center justify-between px-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {filteredExpenses.length === expenses.length
                    ? 'Total'
                    : `Total (${filteredExpenses.length} of ${expenses.length})`}
                </span>
                <span className="text-base font-bold tabular-nums">
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
                    (e) => e.id.toString() === activeId
                  );
                  if (!expense) return null;
                  const isRecurring = recurringExpensesList.some(
                    (recurring) =>
                      recurring.name === expense.description &&
                      Math.abs(recurring.amount - expense.amount) < 0.01 &&
                      recurring.isActive
                  );
                  return (
                    <DraggableExpenseItem
                      expense={expense}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      isRecurring={isRecurring}
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
