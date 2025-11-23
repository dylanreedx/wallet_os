# P8-010: Invite Friends UI

## Description
Add a UI mechanism to invite friends using the newly created invite link backend.

## Requirements
- [x] Add an "Invite Friend" button in the Friends tab.
- [x] On click, generate a new invite link via `POST /api/social/friends/invite-link`.
- [x] Display the link in a modal or drawer with a "Copy" button.
- [x] (Optional) Native share sheet integration for mobile.

## Technical Details
- Endpoint: `/api/social/friends/invite-link`
- Components: `InviteFriendDialog`, `CopyLinkButton`.
