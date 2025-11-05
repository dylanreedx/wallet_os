# Phase 6: Goal Management Features

## Objective
Implement complete goal management with item breakdown, progress tracking, and timeline views.

## Tasks

### 6.1 Goal Creation
- [ ] Integrate goal form with API
- [ ] Handle form submission
- [ ] Validate goal data
- [ ] Create goal items
- [ ] Calculate total from items
- [ ] Set target amount automatically
- [ ] Show success/error feedback

**Files to modify:**
- `src/client/features/goals/GoalForm.tsx`

### 6.2 Goal Item Management
- [ ] Add items to goal
- [ ] Remove items from goal
- [ ] Edit item details (name, price, quantity)
- [ ] Mark items as purchased
- [ ] Update goal progress when item purchased
- [ ] Visual item list with checkboxes

**Files to create:**
- `src/client/features/goals/GoalItemManager.tsx`
- `src/client/features/goals/GoalItemCard.tsx`

### 6.3 Progress Tracking
- [ ] Calculate current amount from purchased items
- [ ] Update progress bar in real-time
- [ ] Show percentage complete
- [ ] Show amount remaining
- [ ] Show days until deadline
- [ ] Progress milestones (25%, 50%, 75%, 100%)
- [ ] Celebration animation on completion

**Files to modify:**
- `src/client/features/goals/GoalProgress.tsx`

### 6.4 Goal Timeline
- [ ] Display goals by target month
- [ ] Group by status (active, completed, upcoming)
- [ ] Show deadline indicators
- [ ] Filter by month/year
- [ ] Sort by deadline or progress
- [ ] Quick actions (edit, delete, share)

**Files to modify:**
- `src/client/features/goals/GoalTimeline.tsx`
- `src/client/features/goals/GoalCard.tsx`

### 6.5 Goal Editing
- [ ] Edit goal details
- [ ] Update target amount
- [ ] Update deadline
- [ ] Update description
- [ ] Add/remove items
- [ ] Save changes via API

**Files to create:**
- `src/client/features/goals/EditGoalDialog.tsx`

### 6.6 Goal Deletion
- [ ] Delete goal with confirmation
- [ ] Cascade delete items
- [ ] Remove from shared goals
- [ ] Show confirmation dialog
- [ ] Handle errors gracefully

### 6.7 Goal Statistics
- [ ] Total goals count
- [ ] Completed goals count
- [ ] Active goals count
- [ ] Total amount spent (on goals)
- [ ] Average goal completion time
- [ ] Goals by category (if added)

**Files to create:**
- `src/client/features/goals/GoalStats.tsx`

## Success Criteria

- [ ] User can create goals with items
- [ ] User can track progress
- [ ] Progress updates correctly
- [ ] Timeline displays goals correctly
- [ ] Items can be marked as purchased
- [ ] Goals can be edited and deleted
- [ ] Statistics display accurately

## Estimated Time

- 6.1 Goal Creation: 4 hours
- 6.2 Goal Item Management: 5 hours
- 6.3 Progress Tracking: 5 hours
- 6.4 Goal Timeline: 4 hours
- 6.5 Goal Editing: 3 hours
- 6.6 Goal Deletion: 2 hours
- 6.7 Goal Statistics: 3 hours

**Total**: ~26 hours
