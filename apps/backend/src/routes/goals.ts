import { FastifyInstance } from 'fastify';
import { db } from '../db';
import { goals } from '../db/dbSchema';
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
    const { userId, name, targetAmount, deadline, targetMonth, description } = request.body;

    if (!userId || !name || !targetAmount || !deadline) {
      return reply.code(400).send({ error: 'Missing required fields' });
    }

    const result = await db
      .insert(goals)
      .values({
        userId,
        name,
        targetAmount,
        deadline: new Date(deadline),
        targetMonth: targetMonth || null,
        description: description || null,
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
    const { name, targetAmount, currentAmount, deadline, targetMonth, description } = request.body;

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
}
