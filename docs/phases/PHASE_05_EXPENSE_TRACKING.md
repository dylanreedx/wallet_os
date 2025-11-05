# Phase 5: Expense Tracking Features

## Objective
Implement complete expense tracking functionality with CRUD operations and analytics.

## Tasks

### 5.1 Expense Creation
- [ ] Integrate expense form with API
- [ ] Handle form submission
- [ ] Show success/error feedback
- [ ] Refresh expense list after creation
- [ ] Add duplicate expense quick-add
- [ ] Add category suggestions based on history

**Files to modify:**
- `src/client/features/expenses/ExpenseForm.tsx`
- `src/client/features/expenses/ExpenseFormDialog.tsx`

### 5.2 Expense List Features
- [ ] Fetch expenses from API
- [ ] Implement infinite scroll or pagination
- [ ] Add date range filtering
- [ ] Add category filtering
- [ ] Add search by description
- [ ] Sort by date, amount, category
- [ ] Group by day/week/month
- [ ] Show total at bottom

**Files to modify:**
- `src/client/features/expenses/ExpenseList.tsx`
- `src/client/features/expenses/ExpenseFilters.tsx`

### 5.3 Expense Editing
- [ ] Edit expense inline or in modal
- [ ] Pre-fill form with existing data
- [ ] Update expense via API
- [ ] Refresh list after update
- [ ] Show confirmation dialog

**Files to create:**
- `src/client/features/expenses/EditExpenseDialog.tsx`

### 5.4 Expense Deletion
- [ ] Swipe-to-delete gesture
- [ ] Confirmation dialog
- [ ] Delete via API
- [ ] Remove from list
- [ ] Undo functionality (optional)

**Files to modify:**
- `src/client/features/expenses/ExpenseItem.tsx`

### 5.5 Category Management
- [ ] Category list/selector
- [ ] Add custom categories
- [ ] Category colors/icons
- [ ] Most used categories first
- [ ] Category statistics

**Files to create:**
- `src/client/features/expenses/CategorySelector.tsx`
- `src/client/features/expenses/CategoryManager.tsx`

### 5.6 Monthly Summary
- [ ] Fetch expenses for selected month
- [ ] Calculate totals
- [ ] Calculate average daily
- [ ] Compare with previous month
- [ ] Show trends (up/down indicators)
- [ ] Export month summary (optional)

**Files to modify:**
- `src/client/features/expenses/MonthlySummary.tsx`

### 5.7 Category Breakdown
- [ ] Fetch expenses grouped by category
- [ ] Calculate percentages
- [ ] Display chart (pie or bar)
- [ ] Click to filter by category
- [ ] Show category details on tap

**Files to modify:**
- `src/client/features/expenses/CategoryBreakdown.tsx`

### 5.8 Data Persistence
- [ ] Cache expenses in localStorage
- [ ] Sync with server
- [ ] Handle offline mode
- [ ] Queue updates when offline
- [ ] Conflict resolution

**Files to create:**
- `src/client/lib/cache.ts`
- `src/client/lib/sync.ts`

## Success Criteria

- [ ] User can create expenses
- [ ] User can view expense list
- [ ] User can edit expenses
- [ ] User can delete expenses
- [ ] Filters work correctly
- [ ] Category breakdown displays accurately
- [ ] Monthly summary shows correct data
- [ ] Offline mode works

## Estimated Time

- 5.1 Expense Creation: 3 hours
- 5.2 Expense List Features: 6 hours
- 5.3 Expense Editing: 3 hours
- 5.4 Expense Deletion: 2 hours
- 5.5 Category Management: 4 hours
- 5.6 Monthly Summary: 4 hours
- 5.7 Category Breakdown: 3 hours
- 5.8 Data Persistence: 6 hours

**Total**: ~31 hours
