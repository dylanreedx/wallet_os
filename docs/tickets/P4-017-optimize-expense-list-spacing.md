# P4-017: Optimize ExpenseList Vertical Spacing

**Status**: TODO  
**Phase**: 4 - Core UI Components  
**Priority**: Medium  
**Estimated Effort**: 1 hour

## Description

Reduce vertical spacing in the ExpenseList component, including date headers, gaps between items, and section spacing. The goal is to show more expenses on screen without scrolling while maintaining clear visual grouping.

## Acceptance Criteria

- [ ] Date header spacing reduced (smaller text, tighter padding)
- [ ] Gap between expense items reduced from `space-y-0.5` to minimal
- [ ] Section spacing between dates optimized
- [ ] ExpenseItem card padding optimized (already at `p-2`, verify it's ideal)
- [ ] More expenses visible per screen

## Technical Details

### Files to Modify
- `apps/frontend/src/features/expenses/ExpenseList.tsx`
- `apps/frontend/src/features/expenses/ExpenseItem.tsx` (if needed)

### Changes Required

1. **Main list spacing**:
   ```tsx
   // From: space-y-2
   // To: space-y-1.5 or space-y-1
   <div className="space-y-1.5">
   ```

2. **Date section spacing**:
   ```tsx
   // From: space-y-1
   // To: space-y-0.5
   <div key={dateKey} className="space-y-0.5">
   ```

3. **Date headers**:
   - Reduce text size if needed (currently `text-xs`)
   - Reduce padding (currently `px-2`)
   - Consider reducing uppercase tracking

4. **Between date sections and items**:
   - Tighter gap between header and first item
   - Clear but compact separation

5. **Expense items gap**:
   ```tsx
   // From: space-y-0.5
   // To: space-y-0 or minimal gap
   <div className="space-y-0">
   ```

## Design Reference

Inspired by:
- Image 1: Stripe transaction list (very tight, clear grouping)
- Image 5: Command palette density

## Related Tickets

- P4-013: Compact ExpensesPage layout
- P4-003: Expense List (original implementation)

