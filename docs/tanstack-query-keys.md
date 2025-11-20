# TanStack Query Keys Documentation

This document provides a comprehensive reference of all query keys used in the application's TanStack Query implementation.

## Query Key Structure

All query keys follow a hierarchical structure: `[entity, ...identifiers, ...filters]`

## Query Keys by Feature

### Expenses
**Hook**: `useExpenses` (file:///Users/dylan/Documents/personal/wallet_os/apps/frontend/src/hooks/useExpenses.ts)

| Query Key | Description | Parameters |
|-----------|-------------|------------|
| `['expenses', userId, startDate, endDate]` | Fetch expenses for a user with optional date range | `userId: number`, `startDate?: string`, `endDate?: string` |

**Mutations**:
- `useCreateExpense` - Invalidates: `['expenses']`, `['monthly-expenses']`
- `useUpdateExpense` - Invalidates: `['expenses']`, `['monthly-expenses']`
- `useDeleteExpense` - Invalidates: `['expenses']`, `['monthly-expenses']`

**Components using this**:
- `ExpenseList`
- `MonthlySummary`
- `CategoryBreakdown`
- `GoalStats`

---

### Goals
**Hook**: `useGoals` (file:///Users/dylan/Documents/personal/wallet_os/apps/frontend/src/hooks/useGoals.ts)

| Query Key | Description | Parameters |
|-----------|-------------|------------|
| `['goals', userId]` | Fetch all goals for a user | `userId: number` |
| `['goals', id]` | Fetch a single goal by ID | `id: number` |

**Mutations**:
- `useCreateGoal` - Invalidates: `['goals']`
- `useUpdateGoal` - Invalidates: `['goals']`
- `useDeleteGoal` - Invalidates: `['goals']`

**Components using this**:
- `GoalsPage`

---

### Monthly Expenses (Recurring)
**Hook**: `useMonthlyExpenses` (file:///Users/dylan/Documents/personal/wallet_os/apps/frontend/src/hooks/useMonthlyExpenses.ts)

| Query Key | Description | Parameters |
|-----------|-------------|------------|
| `['monthly-expenses', userId, includeInactive]` | Fetch recurring monthly expenses | `userId: number`, `includeInactive: boolean` |

**Mutations**:
- `useCreateMonthlyExpense` - Invalidates: `['monthly-expenses']`
- `useUpdateMonthlyExpense` - Invalidates: `['monthly-expenses']`

**Components using this**:
- `ExpenseList`
- `EditExpenseDialog`

---

### Budget
**Hook**: `useBudget` (file:///Users/dylan/Documents/personal/wallet_os/apps/frontend/src/hooks/useBudget.ts)

| Query Key | Description | Parameters |
|-----------|-------------|------------|
| `['budget', 'analysis', userId, month]` | Fetch budget analysis | `userId: number`, `month?: string` |
| `['budget', 'suggestions', userId, month]` | Fetch budget suggestions | `userId: number`, `month?: string` |

**Mutations**:
- `useAnalyzeBudget` - Invalidates: `['budget', 'analysis', ...]`, `['budget', 'suggestions', ...]`

**Components using this**:
- `BudgetPage`

---

## Cache Configuration

**Global Settings** (file:///Users/dylan/Documents/personal/wallet_os/apps/frontend/src/main.tsx):
```typescript
{
  staleTime: 5 * 60 * 1000,        // 5 minutes
  gcTime: 10 * 60 * 1000,          // 10 minutes  
  refetchOnWindowFocus: false,      // Disabled
  retry: 1,                         // 1 retry
}
```

## Cache Invalidation Strategy

### Automatic Invalidation
All mutations automatically invalidate related queries:

- **Expense mutations** → Invalidate `expenses` and `monthly-expenses`
- **Goal mutations** → Invalidate `goals`
- **Monthly expense mutations** → Invalidate `monthly-expenses`
- **Budget mutations** → Invalidate `budget/analysis` and `budget/suggestions`

### Manual Refetch
Components can manually trigger refetch using:
```typescript
const { refetch } = useExpenses({ userId });
refetch(); // Manually refetch
```

## Best Practices

1. **Always use `placeholderData`** to prevent loading flicker:
   ```typescript
   placeholderData: (previousData) => previousData
   ```

2. **Use `enabled` flag** for conditional queries:
   ```typescript
   enabled: !!userId && enabled
   ```

3. **Invalidate related queries** in mutations:
   ```typescript
   onSuccess: () => {
     queryClient.invalidateQueries({ queryKey: ['expenses'] });
   }
   ```

4. **Use consistent query key structure**:
   - Entity first
   - Identifiers second
   - Filters last

## Migration Status

✅ **Complete**:
- Expenses (ExpenseList, MonthlySummary, CategoryBreakdown)
- Goals (GoalsPage, GoalStats)
- Budget (BudgetPage)
- Monthly Expenses (ExpenseList, EditExpenseDialog)

⚠️ **Pending** (still using manual fetching):
- GoalDetailPage
- ExpenseForm
- DescriptionInput
- Dashboard (income)
- GoalForm
- Auth operations

## Future Enhancements

1. Add `@tanstack/react-query-devtools` for debugging
2. Implement optimistic updates for better UX
3. Add custom retry logic per query
4. Implement query prefetching for anticipated navigation
5. Add error boundaries for query errors
