# P7-008: Recurring Monthly Expenses

**Status**: DONE ✅  
**Phase**: 7 - Budget Analysis Features  
**Task ID**: 7.8  
**Estimated Time**: 8 hours  
**Completed**: 2025-01-27 (Basic implementation), 2025-11-05 (Integrated into budget analysis)

## Description

Add recurring monthly expenses (rent, subscriptions, utilities, etc.) that are automatically included in budget analysis. This provides a more complete picture of monthly spending by including fixed/recurring costs that may not be tracked as individual expense entries.

## Acceptance Criteria

### Database & Backend
- [x] Create `monthly_expenses` table with fields: id, userId, name, amount, category, description, isActive
- [x] Generate and run migration
- [x] Create CRUD API routes (`/api/monthly-expenses`)
  - GET: List all monthly expenses for user
  - POST: Create new monthly expense
  - PUT: Update monthly expense
  - DELETE: Delete monthly expense (via isActive flag)
- [x] Integrate monthly expenses into budget analysis calculation
- [x] Include monthly expenses in OpenAI prompt for better recommendations

### Frontend UI/UX
- [x] Basic integration: Recurring expenses created from expense form
- [x] Show monthly expenses in budget analysis results
- [x] Display total fixed monthly expenses vs variable expenses
- [x] Visual indicators for recurring expenses in expense list
- [ ] **Enhanced UX (Future):**
  - [ ] Dedicated monthly expenses management page
  - [ ] Bulk import/export capability (CSV or JSON)
  - [ ] Pre-filled templates (common expenses: Rent, Netflix, Spotify, etc.)
  - [ ] Inline editing (edit without modal when possible)
  - [ ] Category grouping/filtering
  - [ ] Search functionality
  - [ ] Drag-to-reorder for organization
  - [ ] Duplicate expense feature (quick copy)

## Files to Create/Modify

### Backend
- `apps/backend/src/db/schema.ts` - Add monthlyExpenses table
- `apps/backend/src/routes/monthlyExpenses.ts` - CRUD routes
- `apps/backend/src/services/openai.ts` - Include in analysis
- Migration file (auto-generated)

### Frontend
- `apps/frontend/src/features/monthly-expenses/MonthlyExpensesPage.tsx` - Main page
- `apps/frontend/src/features/monthly-expenses/MonthlyExpenseForm.tsx` - Quick add form
- `apps/frontend/src/features/monthly-expenses/MonthlyExpenseItem.tsx` - List item with inline edit
- `apps/frontend/src/features/monthly-expenses/MonthlyExpenseTemplates.tsx` - Template selector
- `apps/frontend/src/features/monthly-expenses/BulkImportDialog.tsx` - Bulk import UI
- `apps/frontend/src/lib/api.ts` - Add monthlyExpenses API methods
- `apps/frontend/src/features/budget/BudgetPage.tsx` - Display monthly expenses in analysis

## UX Best Practices to Implement

1. **Quick Add**: Floating action button or prominent "Add" button with minimal form
2. **Templates**: Pre-populated common expenses (Rent $1200, Netflix $15.99, etc.)
3. **Bulk Import**: Paste CSV or JSON, or upload file
4. **Inline Editing**: Click to edit name/amount directly in list
5. **Toggle Active**: Checkbox to enable/disable without deleting
6. **Visual Feedback**: Total monthly amount prominently displayed
7. **Smart Defaults**: Auto-categorize common expenses (Spotify → Entertainment)
8. **Keyboard Shortcuts**: Enter to save, Escape to cancel
9. **Undo/Redo**: For accidental deletions
10. **Search/Filter**: Quickly find expenses in long lists

## Implementation Notes

Basic implementation completed on 2025-01-27. Integrated approach where recurring expenses are created from the expense form rather than a separate management page. Full details in `docs/logs/2025-01-27-recurring-monthly-expenses-restoration.md`.

## Related Tickets

- [P7-001: Budget Analysis UI](./P7-001-budget-analysis-ui.md)
- [P7-007: Income Tracking](./P7-007-income-tracking.md)
- [P5-005: Category Management](./P5-005-category-management.md)
- [P7-009: Budget Analysis Bug Fixes](./P7-009-budget-analysis-bug-fixes.md)



