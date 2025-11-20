# P2-011: Secure Authentication (Magic Links)

**Status**: DONE ✅  
**Phase**: 2 - Backend API & Services  
**Estimated Time**: Completed

## Description

Implement secure passwordless authentication using Magic Links via Resend.

## Acceptance Criteria

- [x] Create `magic_links` table in database
- [x] Integrate `resend` SDK
- [x] Update Login API to generate token and send email
- [x] Create Verify API to validate token and create session
- [x] Handle token expiration (15 mins)
- [x] Prevent token reuse

## Files Created/Modified

- `apps/backend/src/db/schema.ts`
- `apps/backend/src/routes/auth.ts`
- `apps/backend/package.json`

## Related Tickets

- [P2-001: Authentication routes](./P2-001-authentication-routes.md)
