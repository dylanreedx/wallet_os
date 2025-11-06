# P4-014: Collapsible ExpenseFilters with Mobile Drawer

**Status**: TODO  
**Phase**: 4 - Core UI Components  
**Priority**: High  
**Estimated Effort**: 2-3 hours

## Description

Transform the ExpenseFilters component to be collapsible by default, saving significant vertical space. On mobile, use a drawer component (bottom sheet) for better UX. On desktop, use an inline collapsible section with a clean toggle button.

## Acceptance Criteria

- [ ] Filters collapsed by default, showing only a compact button/bar
- [ ] Desktop: Inline collapsible with smooth transition
- [ ] Mobile: Drawer/bottom sheet for filter interactions
- [ ] Active filter count badge visible when collapsed
- [ ] Quick "Clear filters" action visible when filters active
- [ ] Compact visual inspired by Stripe and professional data tables

## Technical Details

### Files to Modify
- `apps/frontend/src/features/expenses/ExpenseFilters.tsx`
- May need to add shadcn Drawer component if not present

### Changes Required

1. **Add collapsed state**:
   ```tsx
   const [isOpen, setIsOpen] = useState(false);
   const isMobile = useMediaQuery('(max-width: 768px)');
   ```

2. **Collapsed view** (always visible):
   - Single row with filter icon button
   - Active filter count badge
   - Clear filters button (when filters active)

3. **Desktop expanded view**:
   - Use collapsible/accordion pattern
   - Smooth height transition
   - Compact padding (reduce from `p-4` to `p-3`, `space-y-3` to `space-y-2`)

4. **Mobile expanded view**:
   - Use shadcn Drawer component (bottom sheet)
   - Swipe to dismiss
   - Apply button at bottom

## Design Reference

Inspired by:
- Image 1: Stripe payment filters (clean, professional)
- Image 2: Store filters with selected states
- Image 3: Mobile filter drawer pattern

## Related Tickets

- P4-013: Compact ExpensesPage layout

