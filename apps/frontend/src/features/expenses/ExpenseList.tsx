import { useEffect, useState, useRef, useMemo } from 'react';
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
import { DraggableExpenseItem, DragStateContext, type DragStateValue } from './DraggableExpenseItem';
import { ExpenseItem } from './ExpenseItem';
import { cn } from '@/lib/utils';



interface ExpenseListProps {
  refreshTrigger?: number;
  selectedCategory?: string | null;
}



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

type PointerMode = 'touch' | 'pointer';

function usePointerMode() {
  const [mode, setMode] = useState<PointerMode>('pointer');

  useEffect(() => {
    const updateMode = () => {
      if (typeof window === 'undefined' || typeof window.matchMedia === 'undefined') {
        setMode('pointer');
        return;
      }
      const prefersFine = window.matchMedia('(pointer: fine)').matches;
      const prefersCoarse = window.matchMedia('(pointer: coarse)').matches;
      if (!prefersFine && prefersCoarse) {
        setMode('touch');
      } else {
        setMode('pointer');
      }
    };

    updateMode();
    window.addEventListener('resize', updateMode);
    return () => window.removeEventListener('resize', updateMode);
  }, []);

  return mode;
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

  const [orderedExpenses, setOrderedExpenses] = useState<Expense[]>([]);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleteConfirmExpense, setDeleteConfirmExpense] = useState<Expense | null>(null);

  // Fetch recurring expenses using TanStack Query
  const { data: recurringExpensesList = [] } = useMonthlyExpenses({
    userId: user?.id,
    includeInactive: false,
  });

  useEffect(() => {
    setOrderedExpenses((prev) => {
      if (prev.length === expenses.length) {
        let isSame = true;
        for (let i = 0; i < prev.length; i += 1) {
          if (prev[i]?.id !== expenses[i]?.id) {
            isSame = false;
            break;
          }
        }
        if (isSame) {
          return prev;
        }
      }
      return expenses;
    });
  }, [expenses]);

  // Drag-and-drop state (both desktop and mobile)
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dragMeta, setDragMeta] = useState<DragStateValue>({
    activeId: null,
    originDateKey: null,
    originIndex: null,
  });
  const [dropDateKey, setDropDateKey] = useState<string | null>(null);

  // Pull-to-refresh state (mobile only)
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const pointerMode = usePointerMode();
  // Force touch mode if isMobile is true (width < 768px) or if pointer query says coarse
  const isTouchOnlyInput = pointerMode === 'touch' || isMobile;

  // Configure sensors for drag and drop (BOTH DESKTOP AND MOBILE)
  const sensors = useSensors(
    useSensor(TouchSensor),
    useSensor(PointerSensor),
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
  const filteredExpenses = orderedExpenses.filter((expense: Expense) => {
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
  const groupedExpenses = useMemo(() => {
    return filteredExpenses.reduce((groups: Record<string, Expense[]>, expense: Expense) => {
      const dateKey = getDateKey(expense.date);

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(expense);
      return groups;
    }, {} as Record<string, Expense[]>);
  }, [filteredExpenses]);

  const dateSections = useMemo(
    () =>
      Object.entries(groupedExpenses)
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([dateKey, dateExpenses]) => ({
          dateKey,
          expenses: dateExpenses as Expense[],
        })),
    [groupedExpenses]
  );

  const sortableIds = useMemo(
    () =>
      dateSections.flatMap((section) =>
        section.expenses.map((expense) => expense.id.toString())
      ),
    [dateSections]
  );

  // ==================== DESKTOP: Drag-and-drop handlers ====================
  
  const resetDragState = () => {
    setActiveId(null);
    setDropDateKey(null);
    setDragMeta({
      activeId: null,
      originDateKey: null,
      originIndex: null,
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    const activeIdentifier = event.active.id as string;
    setActiveId(activeIdentifier);
    setDropDateKey(null);
    triggerHaptic();

    const draggedExpense = filteredExpenses.find(
      (e: Expense) => e.id.toString() === activeIdentifier
    );

    if (!draggedExpense) {
      setDragMeta({
        activeId: activeIdentifier,
        originDateKey: null,
        originIndex: null,
      });
      return;
    }

    const originDateKey = getDateKey(draggedExpense.date);
    const originList = groupedExpenses[originDateKey] || [];
    const originIndex = originList.findIndex(
      (e: Expense) => e.id.toString() === activeIdentifier
    );

    setDragMeta({
      activeId: activeIdentifier,
      originDateKey,
      originIndex,
    });
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over) {
      setDropDateKey(null);
      return;
    }

    const activeId = active.id.toString();
    const overId = over.id.toString();

    if (activeId === overId) {
      setDropDateKey(null);
      return;
    }

    const activeExpense = orderedExpenses.find(e => e.id.toString() === activeId);
    const overExpense = orderedExpenses.find(e => e.id.toString() === overId);

    if (!activeExpense || !overExpense) return;

    const activeDateKey = getDateKey(activeExpense.date);
    const overDateKey = getDateKey(overExpense.date);

    // Highlight target date
    if (activeDateKey !== overDateKey) {
      setDropDateKey(overDateKey);
      
      // Update the date of the dragged item to match the target group
      // This causes the item to visually move to the new group immediately
      setOrderedExpenses((prev) => {
        const activeIndex = prev.findIndex((e) => e.id.toString() === activeId);
        const overIndex = prev.findIndex((e) => e.id.toString() === overId);

        if (activeIndex !== -1 && overIndex !== -1) {
          // Create a new array to avoid mutating state directly
          const newExpenses = [...prev];
          
          // Update the date of the dragged item
          newExpenses[activeIndex] = {
            ...newExpenses[activeIndex],
            date: overExpense.date, // Adopt the date of the item we're dragging over
          };
          
          // Move the item in the array to reflect the new order
          return arrayMove(newExpenses, activeIndex, overIndex);
        }
        return prev;
      });
    } else {
      // Same date group - just reorder
      setOrderedExpenses((prev) => {
        const activeIndex = prev.findIndex((e) => e.id.toString() === activeId);
        const overIndex = prev.findIndex((e) => e.id.toString() === overId);

        if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
          return arrayMove(prev, activeIndex, overIndex);
        }
        return prev;
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    // Reset drop highlight
    setDropDateKey(null);

    // If we didn't drop on anything, or dropped on itself
    if (!over || active.id === over.id) {
      resetDragState();
      return;
    }

    const activeId = active.id.toString();
    const draggedExpense = orderedExpenses.find(
      (expense) => expense.id.toString() === activeId
    );

    if (!draggedExpense) {
      resetDragState();
      return;
    }

    // Check if the date actually changed compared to the ORIGINAL date
    // We need to compare against the date it had BEFORE dragging started
    // But since we updated local state during drag, we can check if the current date
    // matches the date of the group it ended up in.
    
    // However, we stored originDateKey in dragMeta
    const currentDateKey = getDateKey(draggedExpense.date);
    const originDateKey = dragMeta.originDateKey;

    if (originDateKey && currentDateKey !== originDateKey) {
      try {
        // Persist the date change
        // We use the current date of the expense because we updated it during dragOver
        const targetDate = new Date(draggedExpense.date);
        await updateExpenseMutation.mutateAsync({
          id: draggedExpense.id,
          data: {
            date: targetDate.toISOString(),
          },
        });
      } catch (error) {
        console.error('Failed to update expense date:', error);
        // Revert would be complex here, ideally we'd refetch or rollback
        refetch(); 
      }
    }

    resetDragState();
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
    return dateSections.map(({ dateKey, expenses: dateExpenses }) => (
      <div key={dateKey} className="mb-2 last:mb-0">
        {/* Date Header */}
        <div
          className={cn(
            'px-3 py-1.5 mb-1.5 rounded-md transition-colors',
            dropDateKey === dateKey && 'bg-primary/5'
          )}
        >
          <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            {formatDateLabel(dateKey)}
          </h3>
        </div>
        
          {/* Expense Items */}
          <div className="space-y-0">
            {dateExpenses.map((expense: Expense) => (
            <div key={expense.id}>
              <DraggableExpenseItem
                expense={expense}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isRecurring={isRecurring(expense)}
              />
            </div>
          ))}
        </div>
      </div>
    ));
  };

  return (
    <div className="space-y-3">
      {/* Filters */}
      <ExpenseFiltersComponent filters={filters} onFiltersChange={setFilters} />



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
        <DragStateContext.Provider value={dragMeta}>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={resetDragState}
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
              className="border rounded-lg bg-card p-2 w-full"
              style={{ touchAction: 'pan-y' }}
            >
              <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
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
          </DndContext>

          {/* Drag Overlay */}
          <DragOverlay>
            {activeId ? (
              <div className="opacity-90">
                {(() => {
                  const expense = filteredExpenses.find(
                    (e: Expense) => e.id.toString() === activeId
                  );
                  if (!expense) return null;
                  return (
                    <ExpenseItem
                      expense={expense}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      isRecurring={isRecurring(expense)}
                      isDragging
                      isAnyItemDragging
                      isDragOrigin
                    />
                  );
                })()}
              </div>
            ) : null}
          </DragOverlay>
        </DragStateContext.Provider>
      )}

      {/* Edit Dialog */}
      <EditExpenseDialog
        expense={editingExpense}
        open={editingExpense !== null}
        onOpenChange={(open: boolean) => !open && setEditingExpense(null)}
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
