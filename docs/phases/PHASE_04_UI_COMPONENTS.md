# Phase 4: Core UI Components & Layout

## Objective
Build mobile-first UI components and layout structure for the expense tracker app.

## Tasks

### 4.1 Mobile Navigation
- [ ] Create bottom navigation bar component
- [ ] Add navigation items: Home, Expenses, Goals, Budget
- [ ] Implement active state styling
- [ ] Add smooth transitions between views
- [ ] Ensure touch-friendly tap targets (min 44x44px)

**Files to create:**
- `src/client/components/navigation/BottomNav.tsx`

**Requirements:**
- Fixed position at bottom
- Safe area insets for iPhone
- Smooth slide animations
- Icons from lucide-react

### 4.2 Expense Entry Form
- [ ] Create expense form component
- [ ] Add date picker (mobile-optimized)
- [ ] Add amount input with currency formatting
- [ ] Add category selector
- [ ] Add description textarea
- [ ] Form validation with react-hook-form + zod
- [ ] Submit handler with API integration
- [ ] Success/error feedback

**Files to create:**
- `src/client/features/expenses/ExpenseForm.tsx`
- `src/client/features/expenses/ExpenseFormDialog.tsx` (opens as bottom sheet on mobile)

**Requirements:**
- Mobile-first design
- Smooth animations on open/close
- Auto-focus on first input
- Keyboard-friendly navigation

### 4.3 Expense List
- [ ] Create expense list component
- [ ] Display expenses in chronological order
- [ ] Add date grouping (Today, Yesterday, This Week, etc.)
- [ ] Add swipe-to-delete gesture
- [ ] Add pull-to-refresh
- [ ] Add filtering by category
- [ ] Add filtering by date range
- [ ] Add search functionality
- [ ] Loading states
- [ ] Empty state

**Files to create:**
- `src/client/features/expenses/ExpenseList.tsx`
- `src/client/features/expenses/ExpenseItem.tsx`
- `src/client/features/expenses/ExpenseFilters.tsx`

**Requirements:**
- Virtual scrolling for performance
- Smooth animations
- Swipe gestures (mobile)
- Pull-to-refresh

### 4.4 Category Breakdown
- [ ] Create category breakdown chart
- [ ] Display spending by category
- [ ] Add visual chart (pie or bar)
- [ ] Show percentage breakdown
- [ ] Click to filter expenses by category

**Files to create:**
- `src/client/features/expenses/CategoryBreakdown.tsx`

**Requirements:**
- Simple chart library (recharts or chart.js)
- Mobile-responsive
- Touch-friendly interactions

### 4.5 Monthly Summary
- [ ] Create monthly expense summary view
- [ ] Display total spent
- [ ] Display average daily spending
- [ ] Display category breakdown
- [ ] Add month selector
- [ ] Compare with previous month

**Files to create:**
- `src/client/features/expenses/MonthlySummary.tsx`

### 4.6 Goal Creation Form
- [ ] Create goal form component
- [ ] Add goal name input
- [ ] Add target amount input
- [ ] Add deadline date picker
- [ ] Add target month selector
- [ ] Add description textarea
- [ ] Add goal items section
- [ ] Add/remove item functionality
- [ ] Auto-calculate total from items
- [ ] Form validation

**Files to create:**
- `src/client/features/goals/GoalForm.tsx`
- `src/client/features/goals/GoalFormDialog.tsx`
- `src/client/features/goals/GoalItemInput.tsx`

**Requirements:**
- Dynamic item list
- Real-time total calculation
- Mobile-optimized

### 4.7 Goal Progress Visualization
- [ ] Create goal progress component
- [ ] Display progress bar
- [ ] Show current vs target amount
- [ ] Show percentage complete
- [ ] Show days remaining
- [ ] Display goal items checklist
- [ ] Add item purchase toggle

**Files to create:**
- `src/client/features/goals/GoalProgress.tsx`
- `src/client/features/goals/GoalItemList.tsx`

**Requirements:**
- Animated progress bars
- Visual feedback
- Touch-friendly checkboxes

### 4.8 Goal Timeline View
- [ ] Create goal timeline component
- [ ] Display goals by target month
- [ ] Show upcoming deadlines
- [ ] Group goals by status (active, completed, upcoming)
- [ ] Add goal detail view

**Files to create:**
- `src/client/features/goals/GoalTimeline.tsx`
- `src/client/features/goals/GoalCard.tsx`

### 4.9 Mobile Gestures & Animations
- [ ] Implement swipeable cards
- [ ] Add pull-to-refresh
- [ ] Add bottom sheet modals
- [ ] Add smooth page transitions
- [ ] Add loading skeletons
- [ ] Add micro-interactions

**Files to create:**
- `src/client/components/ui/SwipeableCard.tsx`
- `src/client/components/ui/BottomSheet.tsx`
- `src/client/components/ui/PullToRefresh.tsx`

**Requirements:**
- Use CSS transitions for animations
- Touch-friendly gestures
- Smooth 60fps animations

## Dependencies to Install

```bash
npm install recharts react-hook-form zod date-fns
npm install @radix-ui/react-select @radix-ui/react-popover
```

## Design Principles

1. **Mobile-First**: All components designed for mobile, then enhanced for desktop
2. **Touch-Friendly**: Minimum 44x44px tap targets
3. **Smooth Animations**: CSS transitions, 60fps
4. **Accessible**: ARIA labels, keyboard navigation
5. **Performance**: Lazy loading, virtual scrolling, code splitting

## Success Criteria

- [ ] All components work on iPhone Safari
- [ ] Smooth animations throughout
- [ ] Touch gestures work reliably
- [ ] Forms validate correctly
- [ ] Loading states implemented
- [ ] Error handling in place
- [ ] Accessibility tested

## Estimated Time

- 4.1 Mobile Navigation: 2 hours
- 4.2 Expense Entry Form: 4 hours
- 4.3 Expense List: 6 hours
- 4.4 Category Breakdown: 3 hours
- 4.5 Monthly Summary: 3 hours
- 4.6 Goal Creation Form: 5 hours
- 4.7 Goal Progress Visualization: 4 hours
- 4.8 Goal Timeline View: 4 hours
- 4.9 Mobile Gestures: 6 hours

**Total**: ~37 hours
