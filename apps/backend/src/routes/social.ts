import { FastifyInstance } from 'fastify';
import { db } from '../db';
import { sharedGoals, goals, users } from '../db/schema';
import { eq, and, or } from 'drizzle-orm';

export async function socialRoutes(fastify: FastifyInstance) {
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
        and(
          eq(sharedGoals.goalId, goalId),
          eq(sharedGoals.userId, userId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return reply.code(409).send({ error: 'Goal already shared with this user' });
    }

    const result = await db
      .insert(sharedGoals)
      .values({
        goalId,
        userId,
        role,
        createdAt: new Date()
      })
      .returning();

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
        owner: users
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
        user: users
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
      .set({ role })
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
