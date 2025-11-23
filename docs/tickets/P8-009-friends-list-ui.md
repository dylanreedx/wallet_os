# P8-009: Friends List & Management UI

## Description
Implement the "Friends" tab within the Profile section to list current friends and manage incoming requests.

## Requirements
- [x] Fetch and display the list of friends using the `GET /api/social/friends` endpoint.
- [x] Display "Pending Requests" if any (requires backend update to fetch pending).
- [x] Allow accepting/rejecting friend requests.
- [x] Show friend status (e.g., "Online", "Last active").

## Technical Details
- Components: `FriendsList`, `FriendItem`, `FriendRequestItem`.
- State: Use TanStack Query for fetching friends.
