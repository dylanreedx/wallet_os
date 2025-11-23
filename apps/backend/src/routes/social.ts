import { FastifyInstance } from 'fastify';
import { db } from '../db/index.js';
import {
  sharedGoals,
  users,
  goals,
  friends,
  invites,
  notifications,
  NewNotification,
} from '../db/dbSchema.js';
import { eq, and, or } from 'drizzle-orm';
import { randomBytes } from 'crypto';

export async function socialRoutes(fastify: FastifyInstance) {
  // Invite a friend (by email)
  fastify.post('/api/social/friends/invite', async (request, reply) => {
    const { email } = request.body as { email: string };
    // @ts-ignore
    const userId = request.user?.id;

    if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

    // Find user by email
    const friend = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!friend) {
      return reply.status(404).send({ error: 'User not found' });
    }

    if (friend.id === userId) {
      return reply.status(400).send({ error: 'Cannot invite yourself' });
    }

    // Check if already friends
    const existing = await db.query.friends.findFirst({
      where: or(
        and(eq(friends.userId, userId), eq(friends.friendId, friend.id)),
        and(eq(friends.userId, friend.id), eq(friends.friendId, userId))
      ),
    });

    if (existing) {
      return reply.status(400).send({ error: 'Already friends or pending' });
    }

    // Create friendship request
    await db.insert(friends).values({
      userId,
      friendId: friend.id,
      status: 'pending',
    });

    // Create notification for the friend
    const inviteNotification: NewNotification = {
      userId: friend.id,
      type: 'invite',
      title: 'New Friend Request',
      message: 'Someone wants to be your friend!',
      link: '/friends',
    };

    await db.insert(notifications).values(inviteNotification);

    return { message: 'Invitation sent' };
  });

  // Create invite link
  fastify.post<{
    Body: {
      userId: number;
    };
  }>('/api/social/friends/invite-link', async (request, reply) => {
    const { userId } = request.body;

    if (!userId) {
      return reply.status(400).send({ error: 'userId is required' });
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await db.insert(invites).values({
      creatorId: userId,
      token,
      expiresAt,
    });

    // Use configured frontend URL or default to localhost
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const link = `${baseUrl}/invite?token=${token}`;

    return { link };
  });

  // Accept invite via token
  fastify.post<{
    Body: {
      token: string;
      userId: number;
    };
  }>('/api/social/friends/accept-invite', async (request, reply) => {
    const { token, userId } = request.body;

    if (!token || !userId) {
      return reply.status(400).send({ error: 'token and userId are required' });
    }

    // Find the invite
    const invite = await db.query.invites.findFirst({
      where: and(eq(invites.token, token), eq(invites.used, false)),
    });

    if (!invite) {
      return reply
        .status(404)
        .send({ error: 'Invite not found or already used' });
    }

    // Check if expired
    if (invite.expiresAt < new Date()) {
      return reply.status(400).send({ error: 'Invite has expired' });
    }

    // Check if already friends
    const existing = await db.query.friends.findFirst({
      where: or(
        and(eq(friends.userId, invite.creatorId), eq(friends.friendId, userId)),
        and(eq(friends.userId, userId), eq(friends.friendId, invite.creatorId))
      ),
    });

    if (existing) {
      return reply.status(400).send({ error: 'Already friends' });
    }

    // Create friendship (auto-accepted since it's via invite)
    await db.insert(friends).values({
      userId: invite.creatorId,
      friendId: userId,
      status: 'accepted',
    });

    // Mark invite as used
    await db
      .update(invites)
      .set({ used: true })
      .where(eq(invites.id, invite.id));

    // Notify the creator
    const acceptanceNotification: NewNotification = {
      userId: invite.creatorId,
      type: 'invite',
      title: 'Friend Request Accepted',
      message: 'Your invite was accepted!',
      link: '/friends',
    };

    await db.insert(notifications).values(acceptanceNotification);

    return { message: 'Friendship created successfully' };
  });

  // Accept friend request
  fastify.post('/api/social/friends/accept', async (request, reply) => {
    const { friendId } = request.body as { friendId: number };
    // @ts-ignore
    const userId = request.user?.id;

    if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

    // Find pending request where I am the friendId (recipient) and they are the userId (sender)
    await db
      .update(friends)
      .set({ status: 'accepted' })
      .where(
        and(
          eq(friends.userId, friendId),
          eq(friends.friendId, userId),
          eq(friends.status, 'pending')
        )
      );

    // Notify the sender (who is now my friend)
    const senderNotification: NewNotification = {
      userId: friendId,
      type: 'invite',
      title: 'Friend Request Accepted',
      message: 'Your friend request was accepted!',
      link: '/friends',
    };

    await db.insert(notifications).values(senderNotification);

    return { message: 'Friend request accepted' };

    return { message: 'Friend request accepted' };
  });

  // List friends
  fastify.get<{
    Querystring: {
      userId: string;
    };
  }>('/api/social/friends', async (request, reply) => {
    const { userId } = request.query;

    if (!userId) {
      return reply.status(400).send({ error: 'userId is required' });
    }

    const userIdInt = parseInt(userId);

    const userFriends = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        status: friends.status,
      })
      .from(friends)
      .innerJoin(
        users,
        or(
          and(eq(friends.userId, userIdInt), eq(friends.friendId, users.id)),
          and(eq(friends.friendId, userIdInt), eq(friends.userId, users.id))
        )
      )
      .where(
        or(eq(friends.userId, userIdInt), eq(friends.friendId, userIdInt))
      );

    return userFriends;
  });

  // Share a goal with another user
  fastify.post<{
    Body: {
      goalId: number;
      userId: number;
      role?: 'viewer' | 'contributor' | 'owner';
    };
  }>('/api/social/goals/share', async (request, reply) => {
    const { goalId, userId, role = 'viewer' } = request.body;

    if (!goalId || !userId) {
      return reply.code(400).send({ error: 'goalId and userId are required' });
    }

    // Verify goal exists
    const goal = await db
      .select()
      .from(goals)
      .where(eq(goals.id, goalId))
      .limit(1);

    if (goal.length === 0) {
      return reply.code(404).send({ error: 'Goal not found' });
    }

    // Verify user exists
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user.length === 0) {
      return reply.code(404).send({ error: 'User not found' });
    }

    // Check if already shared
    const existing = await db
      .select()
      .from(sharedGoals)
      .where(
        and(eq(sharedGoals.goalId, goalId), eq(sharedGoals.userId, userId))
      )
      .limit(1);

    if (existing.length > 0) {
      return reply
        .code(409)
        .send({ error: 'Goal already shared with this user' });
    }

    const insertValues = {
      goalId,
      userId,
      role,
      createdAt: new Date(),
    };

    const result = await db
      .insert(sharedGoals)
      .values(insertValues as any)
      .returning();

    // Notify the user
    const shareNotification: NewNotification = {
      userId,
      type: 'goal_share',
      title: 'Goal Shared With You',
      message: `You have been invited to collaborate on a goal.`,
      link: `/goals/${goalId}`,
    };

    await db.insert(notifications).values(shareNotification);

    return reply.code(201).send(result[0]);
  });

  // Get shared goals for a user
  fastify.get<{
    Querystring: {
      userId: string;
    };
  }>('/api/social/goals', async (request, reply) => {
    const { userId } = request.query;

    if (!userId) {
      return reply.code(400).send({ error: 'userId is required' });
    }

    const result = await db
      .select({
        sharedGoal: sharedGoals,
        goal: goals,
        owner: users,
      })
      .from(sharedGoals)
      .innerJoin(goals, eq(sharedGoals.goalId, goals.id))
      .innerJoin(users, eq(goals.userId, users.id))
      .where(eq(sharedGoals.userId, parseInt(userId)));

    return reply.send(result);
  });

  // Get users who have access to a goal
  fastify.get<{
    Params: { goalId: string };
  }>('/api/social/goals/:goalId/users', async (request, reply) => {
    const { goalId } = request.params;

    const result = await db
      .select({
        sharedGoal: sharedGoals,
        user: users,
      })
      .from(sharedGoals)
      .innerJoin(users, eq(sharedGoals.userId, users.id))
      .where(eq(sharedGoals.goalId, parseInt(goalId)));

    return reply.send(result);
  });

  // Update sharing role
  fastify.put<{
    Params: { goalId: string; userId: string };
    Body: {
      role: 'viewer' | 'contributor' | 'owner';
    };
  }>('/api/social/goals/:goalId/users/:userId', async (request, reply) => {
    const { goalId, userId } = request.params;
    const { role } = request.body;

    const result = await db
      .update(sharedGoals)
      .set({ role } as any)
      .where(
        and(
          eq(sharedGoals.goalId, parseInt(goalId)),
          eq(sharedGoals.userId, parseInt(userId))
        )
      )
      .returning();

    if (result.length === 0) {
      return reply.code(404).send({ error: 'Shared goal not found' });
    }

    return reply.send(result[0]);
  });

  // Unshare a goal
  fastify.delete<{
    Params: { goalId: string; userId: string };
  }>('/api/social/goals/:goalId/users/:userId', async (request, reply) => {
    const { goalId, userId } = request.params;

    const result = await db
      .delete(sharedGoals)
      .where(
        and(
          eq(sharedGoals.goalId, parseInt(goalId)),
          eq(sharedGoals.userId, parseInt(userId))
        )
      )
      .returning();

    if (result.length === 0) {
      return reply.code(404).send({ error: 'Shared goal not found' });
    }

    return reply.code(204).send();
  });
}
