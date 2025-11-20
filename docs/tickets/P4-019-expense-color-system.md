# P4-019: Expense Color System & SUBSCRIPTION Label

**Status**: DONE ✅  
**Phase**: 4 - Core UI Components  
**Priority**: Medium  
**Estimated Effort**: 2 hours  
**Completed**: 2025-11-05

## Description

Added a color system for expense items to improve visual distinction and scannability. Expenses are automatically assigned random colors from a friendly, accessible palette. Changed recurring expense label from "AUTO" to "SUBSCRIPTION" for better clarity.

## Acceptance Criteria

- [x] Add `color` column to expenses table (migration)
- [x] Generate random colors for new expenses on creation
- [x] Assign colors to existing expenses via seed script
- [x] Display colors on expense icons with strong borders and pastel backgrounds
- [x] Apply colors to SUBSCRIPTION badge
- [x] Use neutral grey borders (0.5px) for main expense item cards
- [x] Improve drag placeholder visibility with dashed border
- [x] Change "AUTO" label to "SUBSCRIPTION"

## Technical Details

### Database Changes

**Migration:** `apps/backend/drizzle/0003_heavy_rage.sql`
```sql
ALTER TABLE `expenses` ADD `color` text;
```

**Schema Update:** `apps/backend/src/db/schema.ts`
- Added optional `color: text()` field to expenses table

### Color Palette

Friendly, accessible colors with strong borders and pastel backgrounds:
- Amber: `bg: #FEF3C7, border: #F59E0B, text: #92400E`
- Blue: `bg: #DBEAFE, border: #3B82F6, text: #1E40AF`
- Purple: `bg: #E9D5FF, border: #A855F7, text: #6B21A8`
- Pink: `bg: #FCE7F3, border: #EC4899, text: #9F1239`
- Emerald: `bg: #D1FAE5, border: #10B981, text: #065F46`
- Orange: `bg: #FED7AA, border: #F97316, text: #9A3412`
- Violet: `bg: #F3E8FF, border: #9333EA, text: #581C87`
- Teal: `bg: #CCFBF1, border: #14B8A6, text: #134E4A`
- Red: `bg: #FEE2E2, border: #EF4444, text: #991B1B`
- Green: `bg: #F0FDF4, border: #22C55E, text: #166534`

### Backend Changes

**Files Modified:**
- `apps/backend/src/db/schema.ts` - Added color field
- `apps/backend/src/routes/expenses.ts` - Color generation on create/update

**Color Generation:**
- Random color assigned when creating new expenses
- Colors stored as JSON string: `{ bg: '#...', border: '#...', text: '#...' }`
- Existing expenses without colors get assigned one on update (if missing)

**Seed Script:**
- `apps/backend/scripts/assign-expense-colors.ts` - Assigns colors to all existing expenses
- Run with: `npm run seed:colors` or `npx tsx apps/backend/scripts/assign-expense-colors.ts`

### Frontend Changes

**Files Modified:**
- `apps/frontend/src/features/expenses/ExpenseItem.tsx`
- `apps/frontend/src/features/expenses/ExpenseList.tsx`
- `apps/frontend/src/features/expenses/ExpensePlaceholder.tsx`
- `apps/frontend/src/features/expenses/DraggableExpenseItem.tsx`
- `apps/frontend/src/features/expenses/EditExpenseDialog.tsx`

**Key Design Decisions:**

1. **Neutral Main Borders**: Main expense item cards use subtle grey borders (`0.5px solid hsl(var(--border))`) to match app aesthetic
2. **Color Accents**: Colors appear on:
   - Icon circles (32px with colored background, border, and text)
   - SUBSCRIPTION badge (pill-shaped with colored styling)
3. **Border Thickness**: Reduced from `border-2` (2px) to `0.5px` for subtlety
4. **Drag Placeholder**: Improved with dashed border and better opacity for clearer drop zone indication

### UI Implementation

**ExpenseItem.tsx:**
- Parse color JSON from expense.color field
- Apply colors to icon indicator via inline styles
- Apply colors to SUBSCRIPTION badge
- Main border remains neutral grey (0.5px)
- Falls back to muted styles if no color assigned

**ExpensePlaceholder.tsx:**
- Dashed border (`border-dashed`) with primary color
- Less transparent (`opacity-90`) for better visibility
- Primary-themed background for drop zone indication

## Results

- **Visual Distinction**: Each expense has unique color identification via icon
- **Accessibility**: Color palette chosen for WCAG contrast compliance
- **Clarity**: SUBSCRIPTION label is clearer than "AUTO"
- **Consistency**: Neutral borders maintain app's design system
- **Backward Compatibility**: Existing expenses gracefully handle missing colors

## Scripts Added

- `apps/backend/scripts/assign-expense-colors.ts` - Bulk color assignment
- npm script: `npm run seed:colors`

## Related Tickets

- P4-018: Ultra-Compact ExpenseItem Cards (previous redesign)
- P4-017: Optimize ExpenseList Spacing
- P7-008: Recurring Monthly Expenses


