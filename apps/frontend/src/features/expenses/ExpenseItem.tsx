import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Edit, Repeat, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

// Parse color from JSON string or return defaults
const parseExpenseColor = (colorJson: string | null): ExpenseColor | null => {
  if (!colorJson) return null;
  try {
    return JSON.parse(colorJson) as ExpenseColor;
  } catch {
    return null;
  }
};

interface ExpenseColor {
  bg: string;
  border: string;
  text: string;
}

interface Expense {
  id: number;
  userId: number;
  amount: number;
  description: string;
  category: string | null;
  color: string | null; // JSON string of ExpenseColor
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
  onSwipeStart?: () => void;
  onSwipeEnd?: () => void;
}

// Swipe configuration constants
const DELETE_THRESHOLD = 120; // pixels to swipe before triggering delete
const ACTIVATION_THRESHOLD = 50; // minimum horizontal movement to start swipe
const RESISTANCE_FACTOR = 100; // factor for spring resistance calculation
const VELOCITY_THRESHOLD = 0.5; // pixels per ms for velocity-based completion
const VERTICAL_TOLERANCE = 15; // max vertical movement to allow horizontal swipe
const SWIPE_RATIO = 2; // horizontal must be this many times greater than vertical

// Spring-based resistance calculation
const applySpringResistance = (deltaX: number): number => {
  if (deltaX <= 0) return 0; // Only allow left swipe

  // Apply exponential resistance for natural spring feel
  // Formula: offset = deltaX * (1 - Math.exp(-deltaX / RESISTANCE_FACTOR))
  const resistance = 1 - Math.exp(-deltaX / RESISTANCE_FACTOR);
  const offset = Math.min(deltaX * resistance, DELETE_THRESHOLD);

  return -offset; // Negative for left swipe
};

export function ExpenseItem({
  expense,
  onEdit,
  onDelete,
  isRecurring,
  isDragging,
  onSwipeStart,
  onSwipeEnd,
}: ExpenseItemProps) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchStartTime = useRef<number | null>(null);
  const lastTouchX = useRef<number | null>(null);
  const lastTouchTime = useRef<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  const colorData = parseExpenseColor(expense.color);

  const handleTouchStart = (e: React.TouchEvent) => {
    // Don't allow swipe if dragging (drag-and-drop in progress)
    if (isDragging) return;

    // CRITICAL: DO NOT prevent default or stop propagation here
    // This allows the drag sensor to detect the long press
    // We'll only interfere if we detect actual horizontal swipe movement

    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    touchStartTime.current = Date.now();
    lastTouchX.current = touch.clientX;
    lastTouchTime.current = Date.now();
    setIsSwiping(false); // Start as false - only set true when horizontal swipe detected
    setIsAnimating(false);

    // Cancel any ongoing animation
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // Don't allow swipe if dragging (drag-and-drop in progress)
    if (isDragging) return;

    if (touchStartX.current === null || touchStartY.current === null) return;

    const touch = e.touches[0];
    const touchX = touch.clientX;
    const touchY = touch.clientY;
    const now = Date.now();

    const deltaX = touchStartX.current - touchX;
    const deltaY = Math.abs(touchStartY.current - touchY);

    // Only allow horizontal swipe if:
    // 1. Vertical movement is minimal (within tolerance)
    // 2. Horizontal movement is significantly greater than vertical (ratio check)
    // 3. Swiping left (positive deltaX)
    // 4. Horizontal movement exceeds activation threshold
    if (
      deltaY < VERTICAL_TOLERANCE &&
      deltaX > ACTIVATION_THRESHOLD &&
      deltaX > deltaY * SWIPE_RATIO
    ) {
      // CRITICAL: Only NOW prevent default and stop propagation - we've detected a horizontal swipe
      // This allows drag to work if user is just holding (no horizontal movement)
      e.stopPropagation();
      e.preventDefault();

      // Mark as swiping and notify parent to disable drag
      if (!isSwiping) {
        setIsSwiping(true);
        onSwipeStart?.();
      }

      // Update velocity tracking
      if (lastTouchX.current !== null && lastTouchTime.current !== null) {
        const velocity =
          Math.abs(touchX - lastTouchX.current) / (now - lastTouchTime.current);
        lastTouchX.current = touchX;
        lastTouchTime.current = now;
      }

      // Apply spring-based resistance
      const newOffset = applySpringResistance(deltaX);
      setSwipeOffset(newOffset);
    } else if (deltaX < ACTIVATION_THRESHOLD && deltaY < VERTICAL_TOLERANCE) {
      // Not enough movement yet - don't interfere with drag
      // Don't prevent default - let drag sensor work
      return;
    }
  };

  const calculateVelocity = (): number => {
    if (
      lastTouchX.current === null ||
      lastTouchTime.current === null ||
      touchStartTime.current === null
    ) {
      return 0;
    }

    const timeDelta = Date.now() - lastTouchTime.current;
    if (timeDelta === 0) return 0;

    const distance = Math.abs(lastTouchX.current - (touchStartX.current || 0));
    return distance / timeDelta;
  };

  const animateSpringBack = (target: number) => {
    setIsAnimating(true);
    const start = swipeOffset;
    const distance = target - start;
    const duration = 300; // ms
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Spring easing function: easeOutCubic
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const current = start + distance * easeOutCubic;

      setSwipeOffset(current);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setSwipeOffset(target);
        setIsAnimating(false);
        animationFrameRef.current = null;
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null) return;

    const velocity = calculateVelocity();
    const absOffset = Math.abs(swipeOffset);
    const completionThreshold = DELETE_THRESHOLD * 0.7; // 70% of threshold

    // Determine if swipe should complete based on:
    // 1. Distance swiped >= 70% of delete threshold
    // 2. OR velocity is high enough (fast swipe)
    const shouldComplete =
      absOffset >= completionThreshold ||
      (velocity > VELOCITY_THRESHOLD && absOffset >= DELETE_THRESHOLD * 0.5);

    if (shouldComplete && absOffset >= DELETE_THRESHOLD * 0.5) {
      // Complete swipe - trigger delete
      setSwipeOffset(-DELETE_THRESHOLD);
      // Small delay before delete to show the action
      setTimeout(() => {
        onDelete(expense.id);
        setSwipeOffset(0);
      }, 100);
    } else {
      // Snap back with spring animation
      animateSpringBack(0);
    }

    // Cleanup
    setIsSwiping(false);
    touchStartX.current = null;
    touchStartY.current = null;
    touchStartTime.current = null;
    lastTouchX.current = null;
    lastTouchTime.current = null;

    // Notify parent that swipe has ended (to re-enable drag)
    onSwipeEnd?.();
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
    if (swipeOffset >= 0 || isAnimating) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        animateSpringBack(0);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [swipeOffset, isAnimating]);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Reset swipe when drag starts
  useEffect(() => {
    if (isDragging && swipeOffset !== 0) {
      setSwipeOffset(0);
      setIsSwiping(false);
      setIsAnimating(false);
    }
  }, [isDragging, swipeOffset]);

  return (
    <div className="relative overflow-hidden">
      {/* Delete Action Background */}
      <div
        className={cn(
          'absolute right-0 top-0 bottom-0 flex items-center justify-end pr-3 bg-destructive transition-all duration-200',
          swipeOffset < 0 ? 'opacity-100' : 'opacity-0'
        )}
        style={{ width: `${Math.abs(swipeOffset)}px` }}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          className="text-destructive-foreground hover:bg-destructive/80 h-8 w-8"
          aria-label="Delete expense"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Expense Row - Subtle Border, Colorful Accents */}
      <div
        ref={cardRef}
        className={cn(
          'group relative z-10',
          'bg-card rounded-lg',
          'hover:bg-accent/50',
          'px-3 py-2.5 mb-1.5',
          'select-none', // Prevent text selection
          // Use smooth transition only when not actively swiping
          isAnimating && 'transition-transform duration-300 ease-out',
          !isSwiping && !isAnimating && 'transition-transform duration-150',
          isDragging && 'pointer-events-none opacity-70 scale-[0.98]'
        )}
        style={{
          transform: `translateX(${swipeOffset}px)`,
          border: '0.5px solid hsl(var(--border))',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none',
        }}
        onTouchStart={isDragging ? undefined : handleTouchStart}
        onTouchMove={isDragging ? undefined : handleTouchMove}
        onTouchEnd={isDragging ? undefined : handleTouchEnd}
        onDragStart={(e) => e.preventDefault()} // Prevent native drag
        onContextMenu={(e) => e.preventDefault()} // Prevent context menu
      >
        <div className="flex items-center gap-2 md:gap-3 w-full">
          {/* Icon Indicator - Colorful */}
          <div
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-[0.5px]',
              !colorData && 'bg-muted text-muted-foreground border-border',
              !colorData && isRecurring && 'text-primary border-primary/20'
            )}
            style={
              colorData
                ? {
                    backgroundColor: colorData.bg,
                    color: colorData.text,
                    borderColor: colorData.border,
                  }
                : undefined
            }
          >
            {isRecurring ? (
              <Repeat className="h-4 w-4" />
            ) : (
              <DollarSign className="h-4 w-4" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-sm font-medium truncate text-foreground">
                {expense.description}
              </p>
              {isRecurring && (
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-bold border-[0.5px] shrink-0"
                  style={
                    colorData
                      ? {
                          backgroundColor: colorData.bg,
                          color: colorData.text,
                          borderColor: colorData.border,
                        }
                      : {
                          backgroundColor: 'hsl(var(--primary) / 0.1)',
                          color: 'hsl(var(--primary))',
                          borderColor: 'hsl(var(--primary) / 0.3)',
                        }
                  }
                >
                  SUBSCRIPTION
                </span>
              )}
            </div>
            {expense.category && (
              <p className="text-xs text-muted-foreground truncate">
                {expense.category}
              </p>
            )}
          </div>

          {/* Amount & Actions */}
          <div className="flex items-center gap-2 shrink-0 min-w-[80px]">
            <p className="text-sm font-semibold tabular-nums text-foreground whitespace-nowrap">
              ${expense.amount.toFixed(2)}
            </p>
            <div className="hidden sm:flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
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
      </div>
    </div>
  );
}
