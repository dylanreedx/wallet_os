# P4-024: Filters Modal Keyboard Responsiveness

**Status**: TODO  
**Phase**: 4 - Core UI Components & Layout  
**Priority**: High  
**Estimated Effort**: 3 hours

## Description

When the filters modal opens and the keyboard appears (on mobile), the modal is not responsive. It tries to position itself in the center of the screen, which results in the keyboard blocking the input fields. Users cannot see what they're typing.

## Acceptance Criteria

- [ ] Modal automatically adjusts position when keyboard opens
- [ ] Input fields remain visible above keyboard
- [ ] Modal scrolls or repositions to keep active input in view
- [ ] Handle viewport height changes gracefully
- [ ] Test on iOS Safari (notorious keyboard issues)
- [ ] Test on Android Chrome
- [ ] Ensure modal doesn't break layout on desktop
- [ ] Add smooth transitions for position changes
- [ ] Consider using bottom sheet pattern on mobile instead of centered modal

## Technical Details

### Current Implementation

**File:** `apps/frontend/src/features/expenses/ExpenseFilters.tsx` (lines 233-259)

**Mobile Modal (Bottom Sheet):**
- Already attempts bottom sheet style on mobile (lines 236-246)
- Uses classes: `bottom-0 left-0 right-0 top-auto translate-y-0`
- Has `max-h-[85vh] overflow-y-auto` for scrollability
- BUT: Uses fixed positioning which doesn't account for keyboard

**Dialog Component:**
- Uses shadcn Dialog from `apps/frontend/src/components/ui/dialog.tsx`
- Default DialogContent uses: `top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]` (line 95)
- Mobile override attempts to use `bottom-0` but keyboard pushes content up

**Root Cause:**
1. Fixed positioning ignores keyboard
2. No `visualViewport` API usage
3. No scroll-to-input functionality
4. DialogContent doesn't adjust for viewport height changes

### Proposed Solutions

1. **Use VisualViewport API**
   - Listen to `visualViewport` resize events
   - Calculate available height: `visualViewport.height`
   - Set modal max-height dynamically: `maxHeight: visualViewport.height - 20px`
   - File: `apps/frontend/src/components/ui/dialog.tsx` - Add to DialogContent
   - Reference: `ExpenseFilters.tsx` line 236-246 (mobile dialog)

2. **Auto-Scroll Inputs into View**
   - Add `useEffect` that watches for input focus
   - When input focused, scroll it into view within modal: `input.scrollIntoView({ behavior: 'smooth', block: 'center' })`
   - File: `apps/frontend/src/features/expenses/ExpenseFilters.tsx` - Add scroll handler

3. **Improve Bottom Sheet Positioning**
   - Current bottom sheet already uses `bottom-0` which is good
   - Add `max-height` calculation: `max-h-[calc(100vh-env(keyboard-inset-height))]` (if supported)
   - Or: Calculate dynamically with `visualViewport.height`
   - Ensure content area scrolls properly with `overflow-y-auto`

4. **Input Focus Handling**
   - Add focus handlers to all inputs (Search, DatePicker, Select)
   - Trigger scroll when input receives focus
   - Add padding-bottom to ensure submit button isn't hidden
   - File: `apps/frontend/src/features/expenses/ExpenseFilters.tsx` lines 119-177

5. **Mobile-Specific Dialog Enhancement**
   - Keep bottom sheet pattern (already implemented)
   - Add keyboard inset calculation
   - Adjust padding/spacing when keyboard appears

## Files to Modify

**Primary:**
- `apps/frontend/src/features/expenses/ExpenseFilters.tsx` (lines 233-259) - Add visualViewport handling, input scroll logic
- `apps/frontend/src/components/ui/dialog.tsx` (lines 49-125) - Enhance DialogContent with viewport awareness

**Supporting:**
- Consider creating custom hook: `useKeyboardAwareDialog()` for reusable logic

## Related Tickets

- [P4-014: Collapsible ExpenseFilters](./P4-014-collapsible-expense-filters.md) - Filters implementation

