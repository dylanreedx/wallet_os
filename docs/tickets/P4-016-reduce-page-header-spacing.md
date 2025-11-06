# P4-016: Reduce Page Header Spacing

**Status**: TODO  
**Phase**: 4 - Core UI Components  
**Priority**: Medium  
**Estimated Effort**: 30 minutes

## Description

Reduce spacing and sizing in the ExpensesPage header section to create a more compact, professional appearance. The current header with large title and description takes up too much vertical space.

## Acceptance Criteria

- [ ] Title size reduced from `text-3xl` to `text-2xl` or `text-xl`
- [ ] Description text smaller and tighter to title
- [ ] Overall header height reduced by ~20-30%
- [ ] Add Expense button size optimized

## Technical Details

### Files to Modify
- `apps/frontend/src/features/expenses/ExpensesPage.tsx`

### Changes Required

1. **Title sizing**:
   ```tsx
   // From: text-3xl
   // To: text-2xl
   <h1 className="text-2xl font-bold">Expenses</h1>
   ```

2. **Description spacing**:
   ```tsx
   // Add tighter margin or use smaller text
   <p className="text-sm text-muted-foreground">Track and manage your expenses</p>
   ```

3. **Header container**:
   - Consider reducing gap in flex container
   - Tighter alignment

## Design Reference

Inspired by:
- Image 4: Compact header with clear hierarchy
- Professional data table headers

## Related Tickets

- P4-013: Compact ExpensesPage layout

