# P4-013: Compact ExpensesPage Layout

**Status**: TODO  
**Phase**: 4 - Core UI Components  
**Priority**: High  
**Estimated Effort**: 1 hour

## Description

Reduce vertical spacing throughout the ExpensesPage to create a more information-dense, professional layout inspired by modern data tables and project boards. The current `space-y-6` (24px) between sections is too generous and wastes valuable screen real estate.

## Acceptance Criteria

- [ ] Main container spacing reduced from `space-y-6` to `space-y-3` (12px)
- [ ] Page header padding reduced (currently `min-h-screen p-4 pb-24`)
- [ ] Header title and description spacing tightened
- [ ] Overall vertical density improved without sacrificing readability

## Technical Details

### Files to Modify
- `apps/frontend/src/features/expenses/ExpensesPage.tsx`

### Changes Required

1. **Container spacing**:
   ```tsx
   // Change from: space-y-6
   // Change to: space-y-3
   <div className="max-w-4xl mx-auto space-y-3">
   ```

2. **Page padding**:
   ```tsx
   // Change from: min-h-screen p-4 pb-24
   // Change to: min-h-screen p-3 pb-20
   <div className="min-h-screen p-3 pb-20">
   ```

3. **Header spacing**:
   - Reduce title size from `text-3xl` to `text-2xl`
   - Add tighter spacing to description

## Design Reference

Inspired by:
- Image 4: Project board with professional, tight spacing
- Image 5: Command palette with ultra-compact list items

## Related Tickets

- P4-014: Collapsible ExpenseFilters
- P4-015: Ultra-compact MonthlySummary
- P4-017: Optimize ExpenseList spacing

