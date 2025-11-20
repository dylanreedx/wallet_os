import { FastifyInstance } from 'fastify';
import { db } from '../db';
import { goalItems, goals } from '../db';
import { eq, and } from 'drizzle-orm';

export async function goalItemsRoutes(fastify: FastifyInstance) {
  // Get all items for a goal
  fastify.get<{
    Params: { id: string };
  }>('/api/goals/:id/items', async (request, reply) => {
    const { id } = request.params;

    const result = await db
      .select()
      .from(goalItems)
      .where(eq(goalItems.goalId, parseInt(id)));

    return reply.send(result);
  });

  // Get single goal item
  fastify.get<{
    Params: { goalId: string; itemId: string };
  }>('/api/goals/:goalId/items/:itemId', async (request, reply) => {
    const { goalId, itemId } = request.params;

    const result = await db
      .select()
      .from(goalItems)
      .where(
        and(
          eq(goalItems.goalId, parseInt(goalId)),
          eq(goalItems.id, parseInt(itemId))
        )
      )
      .limit(1);

    if (result.length === 0) {
      return reply.code(404).send({ error: 'Goal item not found' });
    }

    return reply.send(result[0]);
  });

  // Create goal item
  fastify.post<{
    Params: { id: string };
    Body: {
      name: string;
      price: number;
      quantity?: number;
    };
  }>('/api/goals/:id/items', async (request, reply) => {
    const { id } = request.params;
    const { name, price, quantity } = request.body;

    if (!name || !price) {
      return reply.code(400).send({ error: 'Missing required fields' });
    }

    // Verify goal exists
    const goal = await db
      .select()
      .from(goals)
      .where(eq(goals.id, parseInt(id)))
      .limit(1);

    if (goal.length === 0) {
      return reply.code(404).send({ error: 'Goal not found' });
    }

    const result = await db
      .insert(goalItems)
      .values({
        goalId: parseInt(id),
        name,
        price,
        quantity: quantity || 1,
        purchased: false,
        createdAt: new Date()
      })
      .returning();

    return reply.code(201).send(result[0]);
  });

  // Update goal item
  fastify.put<{
    Params: { goalId: string; itemId: string };
    Body: {
      name?: string;
      price?: number;
      quantity?: number;
      purchased?: boolean;
    };
  }>('/api/goals/:goalId/items/:itemId', async (request, reply) => {
    const { goalId, itemId } = request.params;
    const { name, price, quantity, purchased } = request.body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (price !== undefined) updateData.price = price;
    if (quantity !== undefined) updateData.quantity = quantity;
    if (purchased !== undefined) updateData.purchased = purchased;

    if (Object.keys(updateData).length === 0) {
      return reply.code(400).send({ error: 'No fields to update' });
    }

    const result = await db
      .update(goalItems)
      .set(updateData)
      .where(
        and(
          eq(goalItems.goalId, parseInt(goalId)),
          eq(goalItems.id, parseInt(itemId))
        )
      )
      .returning();

    if (result.length === 0) {
      return reply.code(404).send({ error: 'Goal item not found' });
    }

    return reply.send(result[0]);
  });

  // Delete goal item
  fastify.delete<{
    Params: { goalId: string; itemId: string };
  }>('/api/goals/:goalId/items/:itemId', async (request, reply) => {
    const { goalId, itemId } = request.params;

    const result = await db
      .delete(goalItems)
      .where(
        and(
          eq(goalItems.goalId, parseInt(goalId)),
          eq(goalItems.id, parseInt(itemId))
        )
      )
      .returning();

    if (result.length === 0) {
      return reply.code(404).send({ error: 'Goal item not found' });
    }

    return reply.code(204).send();
  });
}
