# P4-020: Drag & Drop Mobile Improvements

**Status**: TODO  
**Phase**: 4 - Core UI Components & Layout  
**Priority**: High  
**Estimated Effort**: 4 hours

## Description

The drag-and-drop system on mobile is causing serious UX issues:
- Too easy to accidentally trigger drag on mobile (constant accidental dragging)
- Drag operations feel dangerous and seem to be breaking things
- Slide/swipe feature is broken and no longer works due to drag-and-drop interference

## Acceptance Criteria

- [ ] Implement drag activation delay or threshold to prevent accidental drags
- [ ] Add visual feedback to distinguish between drag and scroll/tap interactions
- [ ] Fix slide/swipe functionality that's broken due to drag-and-drop conflicts
- [ ] Add confirmation or undo for drag operations to reduce perceived risk
- [ ] Implement proper touch event handling to distinguish drag vs scroll gestures
- [ ] Add haptic feedback or better visual indicators for drag start
- [ ] Ensure drag doesn't interfere with normal scrolling behavior
- [ ] Test all drag operations to ensure they're not breaking functionality

## Technical Details

### Current Implementation

**Files:**
- `apps/frontend/src/features/expenses/DraggableExpenseItem.tsx` (lines 31-67)
- `apps/frontend/src/features/expenses/ExpenseList.tsx` (lines 99-114, 202-346)
- `apps/frontend/src/features/expenses/ExpenseItem.tsx` (lines 43-100)

**Current Drag Configuration:**
- Using `@dnd-kit/core` with `PointerSensor`, `KeyboardSensor`, `TouchSensor`
- **PointerSensor**: `distance: 8` (8px movement required)
- **TouchSensor**: `delay: 300` (300ms long-press), `tolerance: 5` (5px movement)
- Entire `DraggableExpenseItem` wrapper has drag listeners (`{...attributes} {...listeners}`)
- Uses `touch-none` class to disable touch scrolling (line 54 in DraggableExpenseItem)

**Swipe Conflict:**
- `ExpenseItem.tsx` has swipe-to-delete functionality (lines 60-100)
- Swipe handlers check `if (isDragging) return;` to prevent conflicts (lines 62, 71)
- BUT: Drag activates before swipe can complete - drag listeners are on parent wrapper

**Root Cause:**
1. **Whole item is draggable** - `{...listeners}` spread on entire item div
2. **TouchSensor delay (300ms) conflicts** with normal scrolling/tapping
3. **`touch-none` class** prevents natural scroll gestures
4. **No drag handle** - entire card is a drag zone
5. **Swipe detection** happens AFTER drag sensors activate

### Proposed Solutions

1. **Add Drag Handle**
   - Remove drag listeners from whole item
   - Add drag handle icon (e.g., grip-vertical) to left/right edge
   - Only enable drag when touching handle
   - Update `DraggableExpenseItem.tsx` to conditionally apply listeners
   - File: `apps/frontend/src/features/expenses/DraggableExpenseItem.tsx` line 48-53

2. **Increase Activation Threshold**
   - Increase `TouchSensor` delay to 500-800ms (currently 300ms)
   - Increase `distance` on PointerSensor to 15-20px (currently 8px)
   - File: `apps/frontend/src/features/expenses/ExpenseList.tsx` lines 100-113

3. **Fix Swipe Conflict**
   - Remove `touch-none` class from draggable wrapper
   - Let swipe gesture complete before drag activates
   - Improve swipe detection in `ExpenseItem.tsx` (check deltaY vs deltaX ratios)
   - File: `apps/frontend/src/features/expenses/ExpenseItem.tsx` lines 69-87

4. **Better Visual Feedback**
   - Add drag handle icon that only appears on hover/long-press
   - Show haptic feedback when drag activates (already implemented line 117-121)
   - Clearer placeholder during drag
   - File: `apps/frontend/src/features/expenses/ExpensePlaceholder.tsx`

5. **Alternative: Disable Drag on Mobile**
   - Detect mobile and disable drag entirely
   - Keep drag only for desktop where it's more controlled
   - Allow swipe to work normally without conflicts

## Files to Modify

**Primary Changes:**
- `apps/frontend/src/features/expenses/DraggableExpenseItem.tsx` (lines 48-57) - Add drag handle, remove whole-item listeners
- `apps/frontend/src/features/expenses/ExpenseList.tsx` (lines 99-114) - Adjust sensor thresholds
- `apps/frontend/src/features/expenses/ExpenseItem.tsx` (lines 54, 60-100) - Remove `touch-none`, improve swipe detection

**Supporting:**
- `apps/frontend/src/features/expenses/ExpensePlaceholder.tsx` - Enhance visual feedback

## Related Tickets

- [P4-003: Expense List](./P4-003-expense-list.md) - Original drag-and-drop implementation
- [P4-009: Mobile Gestures & Animations](./P4-009-mobile-gestures-animations.md) - Swipe gesture conflicts

