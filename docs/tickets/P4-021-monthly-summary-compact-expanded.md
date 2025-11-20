# P4-021: Monthly Summary Compact/Expanded View

**Status**: TODO  
**Phase**: 4 - Core UI Components & Layout  
**Priority**: Medium  
**Estimated Effort**: 3 hours

## Description

The monthly summary section is too dense and information-heavy. Users need a way to toggle between a compact view (showing essentials) and an expanded view (showing full details).

## Acceptance Criteria

- [ ] Implement compact view mode showing only essential information
- [ ] Implement expanded view mode showing full details
- [ ] Add toggle button/control to switch between views
- [ ] Smooth transition animation between compact/expanded states
- [ ] Compact view should show: total spending, budget remaining (if applicable), main stats
- [ ] Expanded view should show: full breakdown, category splits, trends, charts
- [ ] Remember user preference (localStorage) for next visit
- [ ] Ensure mobile-friendly layout for both views
- [ ] Compact view should use significantly less vertical space

## Technical Details

### Current Implementation

**File:** `apps/frontend/src/features/expenses/MonthlySummary.tsx` (lines 270-435)

**Current Structure:**
- Card header with title and month selector (lines 272-298)
- CardContent with multiple sections (lines 300-432):
  - Total Paid section (lines 304-332) - Large `text-2xl` number
  - Scheduled Expenses (if any, lines 335-350) - Orange highlighted box
  - Average Daily (lines 353-379) - `text-xl` number
  - Stats Grid (lines 382-417) - 3-column grid showing counts

**Content Density:**
- All sections always visible
- No collapsible/expandable sections
- Stats grid always shows Paid Expenses, Upcoming (if any), Days Elapsed
- Previous month comparison always shown if available

**Already Compact Elements:**
- Uses small text sizes (`text-xs`, `text-[10px]`)
- Tight spacing with `space-y-3`
- Compact grid layout
- But still shows ALL information at once

### Proposed Solution

**Compact View:**
- Show only: Total Paid (large number), month selector, expand button
- Hide: Average Daily, Stats Grid, Previous Month comparison
- Optional: Show trend indicator (up/down arrow) next to total
- Single line summary with key metric
- File: `MonthlySummary.tsx` - Add `collapsed` state similar to CategoryBreakdown pattern

**Expanded View:**
- Show everything currently visible (lines 300-417)
- Add smooth transition (use same pattern as CategoryBreakdown lines 344-355)
- Keep all sections: Total, Scheduled Expenses, Average Daily, Stats Grid
- Previous month comparison can stay (useful context)

**Toggle Mechanism:**
- Add ChevronDown button in header (like CategoryBreakdown line 261-277)
- Use same pattern: `collapsed` state, smooth height transition
- Icon rotates when expanded
- File: `MonthlySummary.tsx` - Mirror CategoryBreakdown implementation

**Implementation Pattern:**
Reference `CategoryBreakdown.tsx` (lines 63, 119-147, 261-277, 344-532) for:
- Collapsed/expanded state management
- Height animation with `ref` and `scrollHeight`
- Smooth transitions
- Toggle button styling

## Files to Modify

**Primary:**
- `apps/frontend/src/features/expenses/MonthlySummary.tsx` (lines 270-435) - Add collapsed state, toggle button, conditional rendering

**Reference Implementation:**
- `apps/frontend/src/features/expenses/CategoryBreakdown.tsx` (lines 63, 119-147, 261-277, 344-532) - Use as template for collapse pattern

## Related Tickets

- [P4-015: Ultra-Compact MonthlySummary](./P4-015-ultra-compact-monthly-summary.md) - Previous compaction work

