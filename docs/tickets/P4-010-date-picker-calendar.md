# P4-010: Date Picker Calendar Component

**Status**: DONE  
**Phase**: 4 - Core UI Components & Layout  
**Task ID**: 4.10  
**Estimated Time**: 3 hours

## Description

Replace plain HTML date inputs with a proper calendar/date picker component that provides better UX, especially on mobile devices. The current implementation uses basic `<input type="date">` which is inconsistent across browsers and platforms.

## Acceptance Criteria

- [x] Install/configure shadcn/ui calendar component
- [x] Install/configure shadcn/ui popover component (dependency for calendar)
- [x] Create reusable DatePicker component
- [x] Replace date input in ExpenseForm with DatePicker
- [x] Replace date inputs in ExpenseFilters with DatePicker
- [x] Mobile-optimized calendar display
- [x] Touch-friendly date selection
- [x] Proper date formatting and validation
- [x] Keyboard navigation support

## Files to Create

- `apps/frontend/src/components/ui/calendar.tsx`
- `apps/frontend/src/components/ui/popover.tsx`
- `apps/frontend/src/components/ui/date-picker.tsx` (optional wrapper)

## Files to Modify

- `apps/frontend/src/features/expenses/ExpenseForm.tsx`
- `apps/frontend/src/features/expenses/ExpenseFilters.tsx`

## Dependencies

- @radix-ui/react-popover (for popover)
- react-day-picker (for calendar component)
- date-fns (already installed)

## Related Tickets

- [P4-002: Expense Entry Form](./P4-002-expense-entry-form.md)
- [P4-003: Expense List](./P4-003-expense-list.md)

## Completion Notes

- **Completed**: 2025-11-03
- **Bug Fix**: Fixed modal interaction issue where calendar popover was not clickable inside expense modal dialogs
  - Increased popover z-index to z-[100] to appear above dialog (z-50)
  - Added dynamic overlay pointer-events management to allow clicks through to popover when open
  - Enhanced event handlers to properly detect popover interactions
  - Calendar now fully functional within modal dialogs

