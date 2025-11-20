import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Plus, X } from 'lucide-react';
import { expenseCategories } from './ExpenseFilters';
import { Input } from '@/components/ui/input';

interface CategoryTagsProps {
  selectedCategory: string | undefined;
  onCategoryChange: (category: string | undefined) => void;
  mostUsedCategories?: string[];
}

// Color palette for category tags
const categoryColors: Record<string, string> = {
  'Food & Dining': 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200',
  'Transportation': 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200',
  'Shopping': 'bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200',
  'Entertainment': 'bg-pink-100 text-pink-700 border-pink-200 hover:bg-pink-200',
  'Bills & Utilities': 'bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200',
  'Healthcare': 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200',
  'Travel': 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200',
  'Education': 'bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-200',
  'Personal Care': 'bg-teal-100 text-teal-700 border-teal-200 hover:bg-teal-200',
  'Other': 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200',
};

const defaultColor = 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200';

export function CategoryTags({
  selectedCategory,
  onCategoryChange,
  mostUsedCategories = [],
}: CategoryTagsProps) {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Sort categories: most used first, then alphabetically
  const sortedCategories = [...expenseCategories].sort((a, b) => {
    const aIndex = mostUsedCategories.indexOf(a);
    const bIndex = mostUsedCategories.indexOf(b);
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return a.localeCompare(b);
  });

  const handleTagClick = (category: string) => {
    if (selectedCategory === category) {
      onCategoryChange(undefined);
    } else {
      onCategoryChange(category);
    }
  };

  const handleAddNew = () => {
    if (newCategoryName.trim()) {
      onCategoryChange(newCategoryName.trim());
      setNewCategoryName('');
      setIsAddingNew(false);
    }
  };

  const handleCancelNew = () => {
    setIsAddingNew(false);
    setNewCategoryName('');
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {sortedCategories.map((category) => {
          const isSelected = selectedCategory === category;
          const colorClass = categoryColors[category] || defaultColor;

          return (
            <button
              key={category}
              type="button"
              onClick={() => handleTagClick(category)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                'border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary',
                'active:scale-95',
                isSelected
                  ? `${colorClass} border-current shadow-sm scale-105`
                  : `${colorClass} border-transparent opacity-70 hover:opacity-100`
              )}
              aria-pressed={isSelected}
              aria-label={`${isSelected ? 'Remove' : 'Select'} category ${category}`}
            >
              {category}
            </button>
          );
        })}

        {!isAddingNew && (
          <button
            type="button"
            onClick={() => setIsAddingNew(true)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
              'border-2 border-dashed border-gray-300 text-gray-600',
              'hover:border-gray-400 hover:text-gray-700',
              'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary',
              'flex items-center gap-1.5 active:scale-95'
            )}
            aria-label="Add new category"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Category
          </button>
        )}

        {isAddingNew && (
          <div className="flex items-center gap-2">
            <Input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddNew();
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  handleCancelNew();
                }
              }}
              placeholder="Category name"
              className="h-8 w-32 text-sm"
              autoFocus
            />
            <button
              type="button"
              onClick={handleAddNew}
              className="h-8 px-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              aria-label="Confirm new category"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleCancelNew}
              className="h-8 px-2 rounded-full bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
              aria-label="Cancel adding category"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {selectedCategory && (
        <p className="text-xs text-muted-foreground">
          Selected: <span className="font-medium">{selectedCategory}</span>
        </p>
      )}
    </div>
  );
}






