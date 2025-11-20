import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Search, X, Filter, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export const expenseCategories = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Travel',
  'Education',
  'Personal Care',
  'Other',
] as const;

export interface ExpenseFilters {
  category: string | null;
  startDate: string | null;
  endDate: string | null;
  searchQuery: string;
}

interface ExpenseFiltersProps {
  filters: ExpenseFilters;
  onFiltersChange: (filters: ExpenseFilters) => void;
}

export function ExpenseFiltersComponent({
  filters,
  onFiltersChange,
}: ExpenseFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const dialogContentRef = useRef<HTMLDivElement>(null);
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle visualViewport API for keyboard awareness
  useEffect(() => {
    if (!isMobile || !isOpen) return;

    const updateViewportHeight = () => {
      if (window.visualViewport) {
        setViewportHeight(window.visualViewport.height);
      } else {
        setViewportHeight(window.innerHeight);
      }
    };

    updateViewportHeight();

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateViewportHeight);
      return () => {
        window.visualViewport?.removeEventListener('resize', updateViewportHeight);
      };
    } else {
      window.addEventListener('resize', updateViewportHeight);
      return () => {
        window.removeEventListener('resize', updateViewportHeight);
      };
    }
  }, [isMobile, isOpen]);

  // Auto-scroll focused input into view
  useEffect(() => {
    if (!isMobile || !isOpen) return;

    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target && dialogContentRef.current?.contains(target)) {
        // Small delay to ensure keyboard has appeared
        setTimeout(() => {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }, 300);
      }
    };

    document.addEventListener('focusin', handleFocus);
    return () => document.removeEventListener('focusin', handleFocus);
  }, [isMobile, isOpen]);

  const handleCategoryChange = (value: string) => {
    onFiltersChange({
      ...filters,
      category: value === 'all' ? null : value,
    });
  };

  const handleStartDateChange = (value: string) => {
    onFiltersChange({
      ...filters,
      startDate: value || null,
    });
  };

  const handleEndDateChange = (value: string) => {
    onFiltersChange({
      ...filters,
      endDate: value || null,
    });
  };

  const handleSearchChange = (value: string) => {
    onFiltersChange({
      ...filters,
      searchQuery: value,
    });
  };

  const handleClearFilters = () => {
    onFiltersChange({
      category: null,
      startDate: null,
      endDate: null,
      searchQuery: '',
    });
  };

  const hasActiveFilters =
    filters.category !== null ||
    filters.startDate !== null ||
    filters.endDate !== null ||
    filters.searchQuery.trim() !== '';

  // Count active filters
  const activeFilterCount = [
    filters.category !== null,
    filters.startDate !== null,
    filters.endDate !== null,
    filters.searchQuery.trim() !== '',
  ].filter(Boolean).length;

  // Filter form content (reused for both mobile and desktop)
  const FilterFormContent = () => (
    <>
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search expenses..."
          value={filters.searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Category and Date Range */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {/* Category Filter */}
        <Select
          value={filters.category || 'all'}
          onValueChange={handleCategoryChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {expenseCategories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Start Date */}
        <DatePicker
          value={filters.startDate || undefined}
          onChange={(date) => handleStartDateChange(date || null)}
          placeholder="Start Date"
        />

        {/* End Date */}
        <DatePicker
          value={filters.endDate || undefined}
          onChange={(date) => handleEndDateChange(date || null)}
          placeholder="End Date"
        />
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleClearFilters}
          className="w-full sm:w-auto"
        >
          <X className="mr-2 h-4 w-4" />
          Clear Filters
        </Button>
      )}
    </>
  );

  return (
    <>
      {/* Collapsed Filter Bar */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'flex-1 sm:flex-initial',
            hasActiveFilters && 'border-primary'
          )}
        >
          <Filter className="mr-2 h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-primary text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
          <ChevronDown
            className={cn(
              'ml-2 h-3.5 w-3.5 transition-transform',
              isOpen && !isMobile && 'rotate-180'
            )}
          />
        </Button>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="shrink-0"
          >
            <X className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only sm:ml-2">Clear</span>
          </Button>
        )}
      </div>

      {/* Desktop: Inline Collapsible */}
      {!isMobile && isOpen && (
        <div
          className={cn(
            'space-y-2 p-3 bg-muted/30 rounded-lg',
            'animate-in slide-in-from-top-2 fade-in duration-200'
          )}
        >
          <FilterFormContent />
        </div>
      )}

      {/* Mobile: Drawer (Dialog styled as bottom sheet) */}
      {isMobile && (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent
            ref={dialogContentRef}
            className={cn(
              'overflow-y-auto',
              'sm:max-w-lg',
              // Mobile bottom sheet styling - override default center positioning
              '!bottom-0 !left-0 !right-0 !top-auto !translate-x-0 !translate-y-0',
              'rounded-t-2xl rounded-b-none',
              'border-b-0',
              'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
              'p-4 pb-8' // Extra bottom padding for submit button
            )}
            style={{
              maxHeight: viewportHeight
                ? `${viewportHeight - 20}px`
                : '85vh',
              width: '100%',
              maxWidth: '100%',
            }}
          >
            <DialogHeader className="text-left pb-3">
              <DialogTitle>Filter Expenses</DialogTitle>
              <DialogDescription>
                Refine your expense list with filters
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <FilterFormContent />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

