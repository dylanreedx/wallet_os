import { FastifyInstance } from 'fastify';
import { db } from '../db/index.js';
import {
  goals,
  sharedGoals,
  notifications,
  expenses,
  users,
  NewNotification,
} from '../db/dbSchema.js';
import { eq, desc } from 'drizzle-orm';

export async function goalsRoutes(fastify: FastifyInstance) {
  // Get all goals for a user
  fastify.get<{
    Querystring: {
      userId: string;
    };
  }>('/api/goals', async (request, reply) => {
    const { userId } = request.query;

    if (!userId) {
      return reply.code(400).send({ error: 'userId is required' });
    }

    const result = await db
      .select()
      .from(goals)
      .where(eq(goals.userId, parseInt(userId)))
      .orderBy(desc(goals.createdAt));

    return reply.send(result);
  });

  // Get single goal
  fastify.get<{
    Params: { id: string };
  }>('/api/goals/:id', async (request, reply) => {
    const { id } = request.params;

    const result = await db
      .select()
      .from(goals)
      .where(eq(goals.id, parseInt(id)))
      .limit(1);

    if (result.length === 0) {
      return reply.code(404).send({ error: 'Goal not found' });
    }

    return reply.send(result[0]);
  });

  // Create goal
  fastify.post<{
    Body: {
      userId: number;
      name: string;
      targetAmount: number;
      deadline: string;
      targetMonth?: string;
      description?: string;
    };
  }>('/api/goals', async (request, reply) => {
    const { userId, name, targetAmount, deadline, targetMonth, description } =
      request.body;

    if (!userId || !name || !targetAmount || !deadline) {
      return reply.code(400).send({ error: 'Missing required fields' });
    }

    const baseValues = {
      userId,
      name,
      targetAmount,
      deadline: new Date(deadline),
      description: description || null,
    };

    const result = await db
      .insert(goals)
      .values({
        ...baseValues,
        ...(targetMonth !== undefined
          ? { targetMonth: targetMonth || null }
          : {}),
      })
      .returning();

    return reply.code(201).send(result[0]);
  });

  // Update goal
  fastify.put<{
    Params: { id: string };
    Body: {
      name?: string;
      targetAmount?: number;
      currentAmount?: number;
      deadline?: string;
      targetMonth?: string;
      description?: string;
    };
  }>('/api/goals/:id', async (request, reply) => {
    const { id } = request.params;
    const {
      name,
      targetAmount,
      currentAmount,
      deadline,
      targetMonth,
      description,
    } = request.body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (targetAmount !== undefined) updateData.targetAmount = targetAmount;
    if (currentAmount !== undefined) updateData.currentAmount = currentAmount;
    if (deadline !== undefined) updateData.deadline = new Date(deadline);
    if (targetMonth !== undefined) updateData.targetMonth = targetMonth;
    if (description !== undefined) updateData.description = description;
    updateData.updatedAt = new Date();

    if (Object.keys(updateData).length === 0) {
      return reply.code(400).send({ error: 'No fields to update' });
    }

    const result = await db
      .update(goals)
      .set(updateData)
      .where(eq(goals.id, parseInt(id)))
      .returning();

    if (result.length === 0) {
      return reply.code(404).send({ error: 'Goal not found' });
    }

    // Notify participants
    const participants = await db
      .select({ userId: sharedGoals.userId })
      .from(sharedGoals)
      .where(eq(sharedGoals.goalId, parseInt(id)));

    for (const participant of participants) {
      const notification: NewNotification = {
        userId: participant.userId,
        type: 'goal_update',
        title: 'Goal Updated',
        message: `The goal "${result[0].name}" has been updated.`,
        link: `/goals/${id}`,
      };

      await db.insert(notifications).values(notification);
    }

    return reply.send(result[0]);
  });

  // Delete goal
  fastify.delete<{
    Params: { id: string };
  }>('/api/goals/:id', async (request, reply) => {
    const { id } = request.params;

    const result = await db
      .delete(goals)
      .where(eq(goals.id, parseInt(id)))
      .returning();

    if (result.length === 0) {
      return reply.code(404).send({ error: 'Goal not found' });
    }

    return reply.code(204).send();
  });

  // Get contributions for a goal (all expenses linked to this goal with user info)
  fastify.get<{
    Params: { id: string };
  }>('/api/goals/:id/contributions', async (request, reply) => {
    const { id } = request.params;
    const goalId = parseInt(id);

    // Get all expenses linked to this goal with user info
    const contributionExpenses = await db
      .select({
        expense: expenses,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(expenses)
      .innerJoin(users, eq(expenses.userId, users.id))
      .where(eq(expenses.goalId, goalId))
      .orderBy(desc(expenses.date));

    // Calculate summary by user
    const summaryMap = new Map<
      number,
      { userId: number; name: string | null; email: string; total: number; count: number }
    >();

    for (const { expense, user } of contributionExpenses) {
      if (!summaryMap.has(user.id)) {
        summaryMap.set(user.id, {
          userId: user.id,
          name: user.name,
          email: user.email,
          total: 0,
          count: 0,
        });
      }
      const entry = summaryMap.get(user.id)!;
      entry.total += expense.amount;
      entry.count += 1;
    }

    const summary = Array.from(summaryMap.values()).sort((a, b) => b.total - a.total);
    const totalContributed = summary.reduce((sum, s) => sum + s.total, 0);

    return reply.send({
      expenses: contributionExpenses.map(({ expense, user }) => ({
        ...expense,
        contributor: user,
      })),
      summary,
      totalContributed,
    });
  });
}
