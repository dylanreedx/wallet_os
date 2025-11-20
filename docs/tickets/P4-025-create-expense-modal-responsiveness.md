# P4-025: Create Expense Modal Responsiveness

**Status**: TODO  
**Phase**: 4 - Core UI Components & Layout  
**Priority**: High  
**Estimated Effort**: 4 hours

## Description

The create expense modal is "not responsive AT ALL" and needs serious reworking. It likely suffers from the same keyboard issues as the filters modal, plus additional layout problems on mobile screens.

## Acceptance Criteria

- [ ] Modal is fully responsive on all screen sizes
- [ ] Keyboard doesn't block form inputs
- [ ] Form inputs are properly sized for mobile touch targets (min 44x44px)
- [ ] Form layout adapts to small screens (stacked layout)
- [ ] Date picker works correctly on mobile
- [ ] Submit button is always accessible (not hidden by keyboard)
- [ ] Modal content is scrollable if it exceeds viewport
- [ ] Consider bottom sheet pattern on mobile for better UX
- [ ] Test on iOS Safari and Android Chrome
- [ ] Ensure desktop experience remains polished

## Technical Details

### Current Implementation

**Files:**
- `apps/frontend/src/features/expenses/EditExpenseDialog.tsx` (lines 95-150)
- `apps/frontend/src/features/expenses/ExpenseForm.tsx` (lines 322-533)

**Current Mobile Styling:**
- Already attempts bottom sheet: `bottom-0 left-0 right-0 top-auto` (line 101)
- Has `max-h-[90vh] overflow-y-auto` for scrollability (line 98)
- Uses responsive classes but fixed positioning still problematic

**Form Fields (ExpenseForm.tsx):**
- Amount: `PriceInput` component (line 332)
- Description: `DescriptionInput` component (line 351)
- Category: `CategoryTags` component (line 370)
- Date: `DatePicker` component (line 391)
- Goal: Select dropdown (line 409)
- Goal Item: Select dropdown (line 447)
- Recurring: Checkbox (line 482)

**Issues Found:**
1. **Auto-focus on mount** (line 176-184) focuses first input, which triggers keyboard
2. **Form spacing:** Uses `space-y-4` (16px gaps) which might be tight on mobile
3. **No keyboard handling:** No visualViewport or scroll-to-input logic
4. **Submit button position:** Fixed at bottom, might get hidden by keyboard

### Issues to Address

1. **Keyboard & Viewport Handling** (Similar to P4-024)
   - Add visualViewport API listener in `EditExpenseDialog.tsx`
   - Calculate available height dynamically
   - Auto-scroll focused input into view
   - Ensure submit button remains accessible above keyboard
   - Files: `EditExpenseDialog.tsx` lines 95-109, `dialog.tsx`

2. **Form Field Spacing & Size**
   - Reduce `space-y-4` to `space-y-3` on mobile for tighter layout
   - Ensure inputs meet 44x44px minimum touch target (check PriceInput, DescriptionInput)
   - File: `ExpenseForm.tsx` line 324

3. **Input Auto-Focus Behavior**
   - Current auto-focus (line 176-184) triggers keyboard immediately
   - Delay focus or remove on mobile, keep on desktop
   - File: `ExpenseForm.tsx` lines 175-184

4. **Submit Button Accessibility**
   - Add padding-bottom to form to keep button visible
   - Use fixed positioning for submit button on mobile (sticky at bottom)
   - Or: Scroll form so button appears above keyboard when focused
   - File: `ExpenseForm.tsx` lines 508-529

5. **Form Field Components**
   - Check `PriceInput.tsx`, `DescriptionInput.tsx`, `CategoryTags.tsx` for mobile responsiveness
   - Ensure DatePicker popover doesn't get cut off by keyboard
   - Verify Select dropdowns work properly on mobile

6. **Form Validation & Errors**
   - Ensure error messages don't push content off-screen
   - Position errors inline without breaking layout
   - File: `ExpenseForm.tsx` - FormMessage components throughout

7. **Full-Screen Mobile Option**
   - Consider making modal full-screen on very small devices (< 380px width)
   - Use `h-screen` instead of `max-h-[90vh]` on small screens
   - Better uses available space, keyboard pushes content up naturally

## Files to Modify

**Primary:**
- `apps/frontend/src/features/expenses/EditExpenseDialog.tsx` (lines 95-150) - Add viewport handling, keyboard awareness
- `apps/frontend/src/features/expenses/ExpenseForm.tsx` (lines 175-533) - Mobile spacing, auto-focus, submit button positioning
- `apps/frontend/src/components/ui/dialog.tsx` (lines 49-125) - Shared dialog enhancements

**Supporting Components (Verify Mobile Support):**
- `apps/frontend/src/features/expenses/PriceInput.tsx`
- `apps/frontend/src/features/expenses/DescriptionInput.tsx`
- `apps/frontend/src/features/expenses/CategoryTags.tsx`
- `apps/frontend/src/components/ui/date-picker.tsx` - Check popover positioning

## Related Tickets

- [P4-002: Expense Entry Form](./P4-002-expense-entry-form.md) - Original form implementation
- [P4-024: Filters Modal Keyboard Responsiveness](./P4-024-filters-modal-keyboard-responsiveness.md) - Similar keyboard issues

