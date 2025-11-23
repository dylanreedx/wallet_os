# P8-012: Goal Chat

**Phase**: 8 - Social Features  
**Status**: ✅ DONE  
**Created**: 2025-11-23  
**Completed**: 2025-11-23

## Description
Implement real-time chat functionality within shared goals to enable collaboration and communication between goal participants.

## Requirements
- [x] Database schema for goal chats
- [x] Backend routes for chat messages
- [x] Frontend GoalChat component
- [x] Access control (only goal owner and shared users)
- [x] Real-time polling for new messages
- [x] Notification on new messages
- [x] Message history with timestamps
- [x] Auto-scroll to latest message

## Implementation Details

### Database
- Created `goal_chats` table with fields: id, goalId, userId, message, createdAt

### Backend
- **File**: `apps/backend/src/routes/goalChats.ts`
- Routes:
  - `GET /api/goals/:goalId/chat` - Get chat messages for a goal
  - `POST /api/goals/:goalId/chat` - Post a chat message
- Access control: Only goal owner and shared users can access chat
- Automatically creates notifications for other participants when a message is sent

### Frontend
- **Component**: `apps/frontend/src/features/goals/GoalChat.tsx`
- Integrated into `GoalDetailPage.tsx`
- Features:
  - Message list with sender name and timestamp
  - Input field with send button
  - Auto-scroll to latest message
  - Polls every 5 seconds for new messages
  - Visual distinction between own messages and others' messages

## UI/UX
- Chat appears at the bottom of goal detail page
- Messages displayed in chat bubbles
- Own messages aligned right with primary color
- Others' messages aligned left with muted background
- Timestamps shown as relative time (e.g., "2 minutes ago")
- 400px height with scrollable message area

## Testing
- [x] Verify only authorized users can access chat
- [x] Verify messages are sent successfully
- [x] Verify messages appear for all participants
- [x] Verify notifications are sent to other participants
- [x] Verify auto-scroll functionality
- [x] Verify message polling

## Notes
- Chat uses polling (5 seconds) for simplicity
- Future enhancement: WebSocket for true real-time messaging
- Messages are not editable or deletable (future enhancement)
