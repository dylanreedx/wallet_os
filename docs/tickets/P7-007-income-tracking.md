# P7-007: Income Tracking

**Status**: DONE ✅  
**Phase**: 7 - Budget Analysis Features  
**Task ID**: 7.7  
**Estimated Time**: 3 hours  
**Completed**: 2025-01-27

## Description

Add income tracking to enable proper budget analysis. Start with a simple monthly income input per user.

## Acceptance Criteria

- [x] Add income field to users table (or separate table)
- [x] Create API route to get/update user income
- [x] Add income input UI (settings or dashboard)
- [x] Update budget analysis to include income in calculations
- [x] Display income vs expenses in analysis results
- [x] Calculate savings rate (income - expenses)

## Files to Create/Modify

- `apps/backend/src/db/schema.ts` - Add income field
- `apps/backend/src/routes/auth.ts` or new route - Income management
- `apps/frontend/src/features/settings/IncomeSettings.tsx` - Income input UI
- `apps/backend/src/services/openai.ts` - Include income in analysis
- `apps/frontend/src/features/budget/BudgetPage.tsx` - Display income data

## Related Tickets

- [P7-001: Budget Analysis UI](./P7-001-budget-analysis-ui.md)
- [P2-001: Authentication routes](./P2-001-authentication-routes.md)
