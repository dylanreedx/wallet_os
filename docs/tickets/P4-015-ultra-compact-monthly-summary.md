# P4-015: Ultra-Compact MonthlySummary

**Status**: TODO  
**Phase**: 4 - Core UI Components  
**Priority**: High  
**Estimated Effort**: 2 hours

## Description

Drastically reduce the vertical footprint of the MonthlySummary component. The collapsed version should be even more compact, and the expanded version needs significant size reduction while maintaining readability and usefulness.

## Acceptance Criteria

- [ ] Collapsed view ultra-compact (single line, ~40-50px height)
- [ ] Expanded view significantly smaller (reduce from current ~400px to ~250px)
- [ ] Reduce internal spacing from `space-y-6` to `space-y-3` or `space-y-2`
- [ ] Reduce card padding from `pb-4` to `pb-2`, `CardContent` spacing optimized
- [ ] Stats presented more horizontally where possible
- [ ] Font sizes reduced slightly (maintain readability)
- [ ] Icon sizes reduced (`h-5 w-5` → `h-4 w-4`)

## Technical Details

### Files to Modify
- `apps/frontend/src/features/expenses/MonthlySummary.tsx`

### Changes Required

1. **Collapsed view improvements**:
   - Make it MORE compact (currently decent, but can go smaller)
   - Consider single-line horizontal layout: Total | Avg Daily | Month selector
   - Height target: 40-50px total

2. **Expanded view spacing**:
   ```tsx
   // Change CardContent spacing:
   // From: space-y-6
   // To: space-y-3
   <CardContent className="space-y-3">
   ```

3. **Header padding**:
   ```tsx
   // From: pb-4
   // To: pb-2
   <CardHeader className="pb-2">
   ```

4. **Individual stat sections**:
   ```tsx
   // From: space-y-2
   // To: space-y-1
   <div className="space-y-1">
   ```

5. **Font size reductions**:
   - Title: `text-xl` → `text-base` or `text-lg`
   - Main numbers: `text-3xl` → `text-2xl`, `text-2xl` → `text-xl`
   - Icons: `h-5 w-5` → `h-4 w-4`
   - Labels: Keep or reduce slightly

6. **Stats grid**:
   - Reduce gap from `gap-4` to `gap-3` or `gap-2`
   - Reduce padding on items

7. **Upcoming expenses box**:
   - Reduce padding from `p-4` to `p-3`
   - Tighter internal spacing

## Design Reference

Target: Information-dense financial dashboard
- Compact stats presentation
- Professional but tight spacing
- Inspired by image 4 (project board density)

## Related Tickets

- P4-013: Compact ExpensesPage layout
- P4-004: Category Breakdown (already has good collapsed state)

