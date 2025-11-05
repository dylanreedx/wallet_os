# P4-011: Calendar View Switcher

**Status**: TODO  
**Phase**: 4 - Core UI Components & Layout  
**Task ID**: 4.11  
**Estimated Time**: 4 hours

## Description

Add a view switcher toggle to allow users to switch between list view and calendar view for expenses. The calendar view would show expenses in a calendar grid format, making it easier to see spending patterns by date.

## Acceptance Criteria

- [ ] Add view switcher toggle (List / Calendar)
- [ ] Create calendar view component
- [ ] Display expenses in calendar grid format
- [ ] Show expense indicators on calendar dates
- [ ] Click on calendar date to see expenses for that day
- [ ] Maintain drag and drop in calendar view (if applicable)
- [ ] Smooth transition between views
- [ ] Mobile-optimized calendar view
- [ ] Highlight current month
- [ ] Navigation between months

## Files to Create

- `apps/frontend/src/features/expenses/ExpenseCalendarView.tsx`
- `apps/frontend/src/features/expenses/ViewSwitcher.tsx`

## Files to Modify

- `apps/frontend/src/features/expenses/ExpensesPage.tsx` - Add view switcher
- `apps/frontend/src/features/expenses/ExpenseList.tsx` - Conditionally render based on view

## Dependencies

- date-fns (for calendar calculations)
- react-day-picker (may already be available)

## Related Tickets

- [P4-003: Expense List](./P4-003-expense-list.md)
- [P4-010: Date Picker Calendar Component](./P4-010-date-picker-calendar.md)

## Design Considerations

- Use a toggle button or segmented control for view switching
- Calendar view should show:
  - Month navigation (previous/next)
  - Current month highlighted
  - Expense indicators (dots or counts) on dates with expenses
  - Click to expand date and show expenses
- Consider mobile-first design
- Smooth animations between view transitions





