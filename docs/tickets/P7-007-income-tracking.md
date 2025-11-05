# P7-007: Income Tracking

**Status**: TODO  
**Phase**: 7 - Budget Analysis Features  
**Task ID**: 7.7  
**Estimated Time**: 3 hours

## Description

Add income tracking to enable proper budget analysis. Start with a simple monthly income input per user.

## Acceptance Criteria

- [ ] Add income field to users table (or separate table)
- [ ] Create API route to get/update user income
- [ ] Add income input UI (settings or dashboard)
- [ ] Update budget analysis to include income in calculations
- [ ] Display income vs expenses in analysis results
- [ ] Calculate savings rate (income - expenses)

## Files to Create/Modify

- `apps/backend/src/db/schema.ts` - Add income field
- `apps/backend/src/routes/auth.ts` or new route - Income management
- `apps/frontend/src/features/settings/IncomeSettings.tsx` - Income input UI
- `apps/backend/src/services/openai.ts` - Include income in analysis
- `apps/frontend/src/features/budget/BudgetPage.tsx` - Display income data

## Related Tickets

- [P7-001: Budget Analysis UI](./P7-001-budget-analysis-ui.md)
- [P2-001: Authentication routes](./P2-001-authentication-routes.md)







