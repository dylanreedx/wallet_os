# P4-022: Category Breakdown Graph Animation

**Status**: TODO  
**Phase**: 4 - Core UI Components & Layout  
**Priority**: Low  
**Estimated Effort**: 2 hours

## Description

The graph/chart in the expanded category breakdown dialog view has no animation. The chart should animate when the dialog opens or when data changes to provide better visual feedback.

## Acceptance Criteria

- [ ] Add entrance animation when category breakdown dialog opens
- [ ] Animate chart/graph rendering (progressive reveal or fade-in)
- [ ] Add smooth transitions when chart data updates
- [ ] Ensure animations don't interfere with interactivity
- [ ] Keep animations subtle and performant (60fps)
- [ ] Test on mobile devices for performance

## Technical Details

### Current Implementation

**File:** `apps/frontend/src/features/expenses/CategoryBreakdown.tsx` (lines 418-462)

**Dialog Implementation:**
- Uses shadcn Dialog component (line 418)
- Opens when "View all" button clicked (lines 418-462)
- Contains list of all categories (lines 429-459)
- **NO CHART IN DIALOG** - Only shows category list

**Chart Location:**
- Main chart is in expanded view (NOT in dialog) - lines 357-411
- Uses recharts `PieChart` component (line 360)
- Pie chart with cells (lines 376-391)
- **No animation props currently set** on Pie/Cell components

**Root Cause:**
The dialog mentioned in ticket doesn't contain the chart - the chart is in the main expanded view. Need to clarify which graph needs animation:
1. Main expanded pie chart (lines 357-411) - NO animation currently
2. Collapsed mini chart (lines 287-319) - NO animation currently  
3. Dialog (if user wants chart added there) - Currently just list

### Proposed Solution

**For Main Expanded Chart (lines 357-411):**
1. **Add Recharts Animation**
   - Add `isAnimationActive={true}` to Pie component (line 361)
   - Add `animationDuration={800}` for smooth animation
   - Add `animationBegin={0}` to start immediately
   - Recharts handles pie slice animations automatically
   - File: `CategoryBreakdown.tsx` line 361

2. **Entrance Animation**
   - Dialog already has fade-in via shadcn (handled by DialogContent)
   - Add stagger to chart elements if needed
   - Use CSS `animate-in` classes if recharts animation isn't enough

3. **Mini Chart Animation**
   - Add same animation props to mini pie chart (line 289)
   - Ensure smooth entrance when categoryBreakdown expands
   - File: `CategoryBreakdown.tsx` line 289

4. **Optional: Add Chart to Dialog**
   - If user wants chart in "View all" dialog, add ResponsiveContainer + PieChart there
   - Apply same animation props
   - File: `CategoryBreakdown.tsx` lines 422-428 (DialogContent area)

**Recharts Animation Props:**
```tsx
<Pie
  // ... existing props
  isAnimationActive={true}
  animationDuration={800}
  animationBegin={0}
  animationEasing="ease-out"
/>
```

## Files to Modify

**Primary:**
- `apps/frontend/src/features/expenses/CategoryBreakdown.tsx` (lines 289-313, 357-411) - Add animation props to PieChart components

**Recharts Documentation:**
- Pie component supports: `isAnimationActive`, `animationDuration`, `animationBegin`, `animationEasing`
- Default animation exists but may be disabled - need to explicitly enable

## Related Tickets

- [P4-004: Category Breakdown](./P4-004-category-breakdown.md) - Original category breakdown implementation

