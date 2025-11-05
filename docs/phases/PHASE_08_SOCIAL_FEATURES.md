# Phase 8: Social Features

## Objective
Implement goal sharing and collaborative tracking features.

## Tasks

### 8.1 Share Goal UI
- [ ] Add share button to goal card
- [ ] Create share dialog
- [ ] User search/selection
- [ ] Role selection (viewer, contributor, owner)
- [ ] Share via API
- [ ] Success/error feedback

**Files to create:**
- `src/client/features/social/ShareGoalDialog.tsx`
- `src/client/features/social/UserSelector.tsx`

### 8.2 Shared Goals List
- [ ] Fetch shared goals
- [ ] Display shared goals section
- [ ] Show owner information
- [ ] Show role badge
- [ ] Filter by role
- [ ] Sort by shared date

**Files to create:**
- `src/client/features/social/SharedGoalsList.tsx`
- `src/client/features/social/SharedGoalCard.tsx`

### 8.3 Collaborative Goal Tracking
- [ ] Show contributors on goal
- [ ] Display who contributed what
- [ ] Allow contributors to add items
- [ ] Allow contributors to mark items purchased
- [ ] Permission checks based on role
- [ ] Real-time updates (if WebSockets added)

**Files to create:**
- `src/client/features/social/CollaborativeGoal.tsx`
- `src/client/features/social/ContributorList.tsx`

### 8.4 User Invitation System
- [ ] Invite users by email
- [ ] Send invitation link
- [ ] Accept invitation
- [ ] Invitation status tracking
- [ ] Resend invitation

**Files to create:**
- `src/client/features/social/InviteUserDialog.tsx`
- `src/client/features/social/InvitationManager.tsx`

### 8.5 Role Management
- [ ] Display current role
- [ ] Change user role (if owner)
- [ ] Remove user from shared goal
- [ ] Role-based UI restrictions
- [ ] Permission checks

**Files to create:**
- `src/client/features/social/RoleManager.tsx`
- `src/client/features/social/PermissionGuard.tsx`

### 8.6 Shared Expense Contributions
- [ ] Track expenses toward shared goals
- [ ] Show who contributed how much
- [ ] Split goal cost among contributors
- [ ] Contribution history
- [ ] Contribution summaries

**Files to create:**
- `src/client/features/social/ContributionTracker.tsx`
- `src/client/features/social/ContributionHistory.tsx`

## Success Criteria

- [ ] Goals can be shared with users
- [ ] Shared goals display correctly
- [ ] Contributors can collaborate
- [ ] Roles are enforced
- [ ] Invitations work
- [ ] Contributions are tracked

## Estimated Time

- 8.1 Share Goal UI: 4 hours
- 8.2 Shared Goals List: 3 hours
- 8.3 Collaborative Goal Tracking: 6 hours
- 8.4 User Invitation System: 5 hours
- 8.5 Role Management: 4 hours
- 8.6 Shared Expense Contributions: 5 hours

**Total**: ~27 hours
