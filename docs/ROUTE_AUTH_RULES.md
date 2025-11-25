# Route Authorization Rules

## Overview

**ALL routes MUST be explicitly categorized as either PUBLIC or PROTECTED.**

When adding new routes, you MUST decide whether they require authentication and apply the middleware accordingly.

## Public Routes (No Auth Required)

These routes are accessible without authentication:

- `/api/health` - Health check endpoint
- `/api/auth/login` - Request magic link
- `/api/auth/verify` - Verify magic link token  
- `/api/auth/verify-code` - Verify login code
- `/api/social/friends/accept-invite` - Accept friend invite via public token

**Implementation:** Register without `onRequest` middleware:
```typescript
await fastify.register(authRoutes);
```

## Protected Routes (Auth Required)

These routes require a valid session (checked via `x-session-id` header):

- `/api/expenses/*` - All expense operations
- `/api/goals/*` - All goal operations (including chat)
- `/api/goal-items/*` - Goal item management
- `/api/budget/*` - Budget operations
- `/api/social/*` - Social features (friends, sharing, notifications)
- `/api/monthly-expenses/*` - Monthly expense management
- `/api/ai/*` - AI-powered features
- `/api/notifications/*` - User notifications

**Implementation:** Register with `authMiddleware` in `onRequest` hook:
```typescript
await fastify.register(someRoutes, { 
  prefix: '', 
  onRequest: [authMiddleware] 
});
```

## How Authentication Works

1. **User logs in** → Backend creates session → Returns `sessionId`
2. **Frontend stores** `sessionId` in localStorage
3. **Every request** includes `x-session-id` header
4. **Auth middleware** runs before route handler:
   - Validates session exists and isn't expired
   - Sets `request.user = { id: userId }` 
   - Returns 401 if invalid/missing
5. **Route handler** accesses authenticated user via `request.user.id`

## Adding New Routes

### For Public Routes
```typescript
// In route file
export async function myPublicRoutes(fastify: FastifyInstance) {
  fastify.get('/api/public/something', async (request, reply) => {
    // No auth check needed
    return { data: 'public' };
  });
}

// In index.ts
await fastify.register(myPublicRoutes);
```

### For Protected Routes
```typescript
// In route file
export async function myProtectedRoutes(fastify: FastifyInstance) {
  fastify.get('/api/protected/something', async (request, reply) => {
    // @ts-ignore
    const userId = request.user?.id;
    
    if (!userId) return reply.status(401).send({ error: 'Unauthorized' });
    
    // Use userId for data access
    return { data: 'protected', userId };
  });
}

// In index.ts
import { authMiddleware } from './middleware/auth.js';

await fastify.register(myProtectedRoutes, { 
  prefix: '', 
  onRequest: [authMiddleware] 
});
```

## Common Mistakes to Avoid

❌ **DON'T** check `request.user?.id` without applying auth middleware
❌ **DON'T** forget to import and apply `authMiddleware` in `index.ts`
❌ **DON'T** apply auth middleware to auth routes (creates circular dependency)
❌ **DON'T** use `request.userId` (wrong property name)

✅ **DO** apply `authMiddleware` via `onRequest` hook
✅ **DO** check `request.user?.id` in route handlers
✅ **DO** return 401 if `userId` is missing
✅ **DO** document whether new routes are public or protected

## Troubleshooting

### "401 Unauthorized" on protected routes
- Verify `authMiddleware` is applied in `index.ts`
- Check frontend is sending `x-session-id` header
- Verify session hasn't expired (7 day TTL)

### "request.user is undefined"
- Ensure route is registered with `onRequest: [authMiddleware]`
- Check middleware is imported correctly

### Auth routes returning 401
- Auth routes should NOT have `authMiddleware` applied
- They handle their own authentication logic
