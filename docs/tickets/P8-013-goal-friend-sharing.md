# P8-013: Goal Friend Sharing UI

**Phase**: 8 - Social Features  
**Status**: ✅ DONE  
**Created**: 2025-11-23  
**Completed**: 2025-11-23

## Description
Integrate friend selection into the goal creation/editing form to enable users to share goals with friends directly when creating or editing a goal.

## Requirements
- [x] Add friend selection to GoalForm
- [x] Display list of accepted friends
- [x] Multi-select checkboxes for friend selection
- [x] Share goal with selected friends on creation
- [x] Set default role as "contributor"
- [x] useFriends hook for friend management
- [x] Only show section if user has friends

## Implementation Details

### Frontend Hook
- **File**: `apps/frontend/src/hooks/useFriends.ts`
- Fetches user's friends using TanStack Query
- Provides methods to invite and accept friends
- Filters to show only accepted friends

### GoalForm Updates
- **File**: `apps/frontend/src/features/goals/GoalForm.tsx`
- Added `sharedWith` field to form schema (array of friend IDs)
- Added friend selection section with checkboxes
- Only displayed when user has friends
- Grid layout (2 columns on desktop, 1 on mobile)
- Shows friend name or email
- Automatically shares goal with selected friends after creation
- Sets role as "contributor" for shared friends

## UI/UX
- Section titled "Share with Friends"
- Description: "Select friends to collaborate on this goal."
- Checkboxes in bordered cards for each friend
- Responsive grid layout
- Only appears if user has accepted friends
- Clean, minimal design matching existing form style

## API Integration
- Uses existing `social.shareGoal()` API method
- Shares goal after creation with selected friends
- Handles errors gracefully (logs to console)
- Continues even if some shares fail

## Testing
- [x] Verify friend list appears when user has friends
- [x] Verify section hidden when no friends
- [x] Verify checkboxes work correctly
- [x] Verify goal is shared with selected friends
- [x] Verify notifications are sent to shared friends
- [x] Verify error handling

## Notes
- Currently only works on goal creation (not editing)
- Future enhancement: Allow editing shared users after creation
- Future enhancement: Allow changing roles
- Sharing happens asynchronously after goal creation
