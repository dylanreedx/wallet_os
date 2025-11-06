import { useState } from 'react';
import { ExpenseFormDialog } from './ExpenseFormDialog';
import { ExpenseList } from './ExpenseList';
import { CategoryBreakdown } from './CategoryBreakdown';
import { MonthlySummary } from './MonthlySummary';

export default function ExpensesPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleExpenseCreated = (expense: any) => {
    // Refresh the expense list
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen p-4 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Expenses</h1>
            <p className="text-muted-foreground">Track and manage your expenses</p>
          </div>
          <ExpenseFormDialog onSuccess={handleExpenseCreated} />
        </div>
        <MonthlySummary refreshTrigger={refreshTrigger} />
        <CategoryBreakdown
          onCategorySelect={setSelectedCategory}
          selectedCategory={selectedCategory}
        />
        <ExpenseList
          refreshTrigger={refreshTrigger}
          selectedCategory={selectedCategory}
        />
      </div>
    </div>
  );
}

