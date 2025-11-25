<!-- 1bd1beeb-5a11-49f0-a3b9-265601571f3f ca605840-fe79-4050-b8f1-95c554c05f63 -->
# TanStack Query Mutation Audit

## Overview

Audit all API calls in the frontend to ensure they use TanStack Query mutation hooks for proper cache invalidation and list refresh.

## Current State

### Hooks that exist (in `/hooks/`):

- `useExpenses.ts`: `useCreateExpense`, `useUpdateExpense`, `useDeleteExpense`
- `useGoals.ts`: `useCreateGoal`, `useUpdateGoal`, `useDeleteGoal`
- `useMonthlyExpenses.ts`: `useCreateMonthlyExpense`, `useUpdateMonthlyExpense` (missing delete)

### Missing hooks needed:

- `useGoalItems.ts` (new file): `useGoalItems`, `useCreateGoalItem`, `useUpdateGoalItem`, `useDeleteGoalItem`

## Files to Fix

### 1. GoalForm.tsx - Multiple direct API calls

- `goals.update()` -> use `useUpdateGoal`
- `goals.create()` -> use `useCreateGoal`
- `goalItems.delete()` -> need new `useDeleteGoalItem`
- `goalItems.create()` -> need new `useCreateGoalItem`

### 2. GoalDetailPage.tsx - Direct API calls

- `goalItems.update()` -> need new `useUpdateGoalItem`
- `goals.delete()` -> use `useDeleteGoal`

### 3. ExpenseForm.tsx - Monthly expense calls (partial fix done)

- `monthlyExpenses.update()` -> use `useUpdateMonthlyExpense`
- `monthlyExpenses.create()` -> use `useCreateMonthlyExpense`

## Implementation Steps

1. Create `useGoalItems.ts` hook file with all CRUD mutations
2. Update `GoalForm.tsx` to use goal and goalItem mutation hooks
3. Update `GoalDetailPage.tsx` to use mutation hooks
4. Update `ExpenseForm.tsx` to use monthly expense mutation hooks
5. Add documentation note about always using mutation hooks

### To-dos

- [ ] Create useGoalItems.ts with query and mutation hooks for goal items CRUD
- [ ] Update GoalForm.tsx to use useCreateGoal, useUpdateGoal, and goalItem mutation hooks
- [ ] Update GoalDetailPage.tsx to use useDeleteGoal and useUpdateGoalItem hooks
- [ ] Update ExpenseForm.tsx to use useCreateMonthlyExpense and useUpdateMonthlyExpense
- [ ] Add documentation note about TanStack Query mutation pattern