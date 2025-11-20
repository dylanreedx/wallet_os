# P4-023: Expense Item Full Width & Truncation Fix

**Status**: TODO  
**Phase**: 4 - Core UI Components & Layout  
**Priority**: High  
**Estimated Effort**: 2 hours

## Description

Expense items in the list don't expand to full width, causing the price to stop at approximately 65% from the left edge. This causes severe truncation issues on mobile, making titles unreadable and the UI look broken.

## Acceptance Criteria

- [ ] Expense items expand to use full available width
- [ ] Price/e amount displays at right edge with proper spacing
- [ ] Title/description text has more space and doesn't truncate unnecessarily
- [ ] Ensure proper text overflow handling (ellipsis only when truly needed)
- [ ] Fix layout on mobile screens (< 640px width)
- [ ] Maintain visual hierarchy and readability
- [ ] Ensure drag-and-drop still works with full-width layout
- [ ] Test with long expense descriptions and names

## Technical Details

### Current Implementation

**File:** `apps/frontend/src/features/expenses/ExpenseItem.tsx` (lines 166-251)

**Layout Structure (lines 166-251):**
```
<div className="flex items-center gap-3">  // Main flex container
  <div>Icon (shrink-0)</div>  // Fixed width icon
  <div className="flex-1 min-w-0">  // Content area - CORRECTLY configured
    <p className="truncate">Description</p>  // Line 194 - HAS truncate
    <p className="truncate">Category</p>  // Line 219 - HAS truncate
  </div>
  <div className="flex items-center gap-2 shrink-0">  // Price + actions - Line 226
    <p>Amount</p>  // Line 227-229
    <div>Actions (hover only)</div>
  </div>
</div>
```

**Root Cause Found:**
The layout structure looks correct (`flex-1 min-w-0` on content), BUT:
1. **Gap spacing:** `gap-3` (12px) × 2 gaps = 24px consumed
2. **Icon:** `h-8 w-8` = 32px
3. **Price column:** Uses `shrink-0` but no explicit width - might be taking more space than needed
4. **Hidden actions:** Hover actions take space even when hidden (`opacity-0` but still in layout)
5. **Container padding:** `px-3` adds 12px each side = 24px total

**Actual Issue:** Price stops at ~65% suggests the flex container might not be expanding to full width, OR parent container has constraints.

**Check Parent:** `ExpenseList.tsx` line 565 - container has `border rounded-lg bg-card p-2` but should check if parent has width constraints.

### Proposed Solution

1. **Verify Parent Width**
   - Check `ExpenseList.tsx` line 565 container is `w-full`
   - Ensure no max-width constraints up the component tree
   - File: `apps/frontend/src/features/expenses/ExpensesPage.tsx` - check container widths

2. **Optimize Price Column**
   - Set explicit `min-width` on price (e.g., `min-w-[80px]`)
   - Ensure actions don't take space when hidden (use `hidden` class instead of `opacity-0`)
   - File: `apps/frontend/src/features/expenses/ExpenseItem.tsx` lines 226-250

3. **Reduce Gap Spacing on Mobile**
   - Use responsive gaps: `gap-3 md:gap-3` could be `gap-2 md:gap-3` on mobile
   - Reduce padding on mobile: `px-3 md:px-3` could be `px-2 md:px-3`
   - File: `apps/frontend/src/features/expenses/ExpenseItem.tsx` line 154

4. **Better Text Truncation**
   - Already using `truncate` correctly (line 194, 219)
   - Verify `min-w-0` is applied (line 192) - **CONFIRMED: Already there**
   - Consider showing full text in tooltip/popover on long-press

5. **Debug Width Calculation**
   - Add temporary border colors to debug actual widths
   - Measure computed widths in browser DevTools
   - Check if margin/border calculations are causing the 65% cutoff

## Files to Modify

**Primary:**
- `apps/frontend/src/features/expenses/ExpenseItem.tsx` (lines 148-251) - Optimize layout, reduce gaps/padding on mobile
- `apps/frontend/src/features/expenses/ExpenseList.tsx` (line 565) - Verify container is full width

**Check Parent Context:**
- `apps/frontend/src/features/expenses/ExpensesPage.tsx` - Verify no width constraints
- `apps/frontend/src/features/expenses/DraggableExpenseItem.tsx` - Check wrapper doesn't constrain width

## Related Tickets

- [P4-018: Ultra-Compact ExpenseItem Cards](./P4-018-ultra-compact-expense-items.md) - Recent compact redesign
- [P4-013: Compact ExpensesPage Layout](./P4-013-compact-expenses-layout.md) - Layout context

