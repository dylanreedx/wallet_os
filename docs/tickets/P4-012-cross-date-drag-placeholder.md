# P4-012: Cross-Date Drag Drop Placeholder

**Status**: TODO  
**Phase**: 4 - Core UI Components & Layout  
**Task ID**: 4.12  
**Estimated Time**: 3 hours

## Description

When dragging an expense to a different date group, the UI currently appears to be swapping cards. However, the expense actually joins the target date group (which is the correct behavior). We need to add a visual placeholder/indicator that shows where the expense will be dropped in the target date group.

## Problem Statement

Current behavior:

- User drags expense from Date A to Date B
- UI shows cards appearing to swap positions
- Expense actually joins Date B group (correct)
- No clear visual indication of where in Date B the expense will be placed

Desired behavior:

- When dragging over a different date group, show a placeholder/space indicator
- Placeholder should appear at the drop position within the target date group
- Visual feedback should make it clear the expense is joining the group, not swapping

## Acceptance Criteria

- [ ] Detect when dragging expense over a different date group
- [ ] Show visual placeholder/space indicator at drop position in target date group
- [ ] Placeholder should be visible but clearly indicate it's a drop zone (not an actual expense)
- [ ] Placeholder height matches expense card height
- [ ] Smooth animation when placeholder appears/disappears
- [ ] Works with both mouse and touch drag
- [ ] Accessibility: Screen reader announces drop target location

## Technical Implementation

### Approach

1. Track which date group the dragged item is currently over
2. Calculate the drop position within that date group
3. Insert a placeholder element at that position
4. Style placeholder to be visually distinct (dashed border, reduced opacity, etc.)
5. Remove placeholder when drag ends or leaves the date group

### Visual Design

- Placeholder: Dashed border card, light background, reduced opacity
- Height: Match expense card height
- Animation: Fade in/out smoothly
- Color: Muted, clearly not an actual expense

## Files to Modify

- `apps/frontend/src/features/expenses/ExpenseList.tsx` - Add placeholder logic
- `apps/frontend/src/features/expenses/DraggableExpenseItem.tsx` - May need to expose drag state
- `apps/frontend/src/features/expenses/ExpenseItem.tsx` - Create placeholder component variant

## Files to Create

- `apps/frontend/src/features/expenses/ExpensePlaceholder.tsx` - Placeholder component for drop zones

## Dependencies

- @dnd-kit/core - Already installed
- @dnd-kit/sortable - Already installed

## Related Tickets

- [P4-003: Expense List](./P4-003-expense-list.md) - Base drag and drop implementation
- [P4-009: Mobile Gestures & Animations](./P4-009-mobile-gestures-animations.md) - Drag interactions

## Design Considerations

- Placeholder should be subtle but visible
- Should not interfere with existing drag animations
- Should work seamlessly with cross-date dragging
- Consider using `DragOverlay` or custom placeholder component
- May need to track drag over state in ExpenseList

## Example Implementation

```typescript
// Pseudo-code
const [dragOverDateGroup, setDragOverDateGroup] = useState<string | null>(null);
const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

// In drag handler
if (draggingOverDifferentDateGroup) {
  setDragOverDateGroup(targetDateKey);
  setDragOverIndex(calculatedDropIndex);
}

// In render
{dateExpenses.map((expense, index) => (
  <>
    {dragOverDateGroup === dateKey && dragOverIndex === index && (
      <ExpensePlaceholder />
    )}
    <DraggableExpenseItem ... />
  </>
))}
```

## Testing Checklist

- [ ] Placeholder appears when dragging over different date group
- [ ] Placeholder appears at correct position
- [ ] Placeholder disappears when drag leaves date group
- [ ] Placeholder disappears when drag ends
- [ ] Works with mouse drag
- [ ] Works with touch drag (mobile)
- [ ] Screen reader announces drop location
- [ ] Smooth animations
- [ ] No visual glitches





