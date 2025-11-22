# P2-007: Social sharing routes

**Status**: DONE ✅  
**Phase**: 2 - Backend API & Services  
**Estimated Time**: Completed

## Description

Implement API routes for goal sharing and collaboration features.

## Acceptance Criteria

- [x] POST /api/social/goals/share - Share goal with user
- [x] GET /api/social/goals - Get shared goals
- [x] GET /api/social/goals/:goalId/users - Get users with access
- [x] PUT /api/social/goals/:goalId/users/:userId - Update role
- [x] DELETE /api/social/goals/:goalId/users/:userId - Unshare goal
- [x] Error handling implemented

## Files Created/Modified

- `src/server/routes/social.ts`

## Related Tickets

- [P8-001: Share Goal UI](./P8-001-share-goal-ui.md)
- [P8-002: Shared Goals List](./P8-002-shared-goals-list.md)











