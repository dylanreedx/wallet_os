import { useState } from 'react';
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
import { Search, X } from 'lucide-react';

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

  return (
    <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
    </div>
  );
}

