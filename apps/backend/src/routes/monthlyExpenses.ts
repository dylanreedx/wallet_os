import { FastifyInstance } from 'fastify';
import { db } from '../db';
import { monthlyExpenses } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function monthlyExpensesRoutes(fastify: FastifyInstance) {
  // Get all monthly expenses for a user
  fastify.get<{
    Querystring: {
      userId: string;
      includeInactive?: string;
    };
  }>('/api/monthly-expenses', async (request, reply) => {
    const { userId, includeInactive } = request.query;

    if (!userId) {
      return reply.code(400).send({ error: 'userId is required' });
    }

    const conditions = [eq(monthlyExpenses.userId, parseInt(userId))];
    
    if (includeInactive !== 'true') {
      conditions.push(eq(monthlyExpenses.isActive, true));
    }

    const result = await db
      .select()
      .from(monthlyExpenses)
      .where(and(...conditions))
      .orderBy(desc(monthlyExpenses.createdAt));

    return reply.send(result);
  });

  // Create monthly expense
  fastify.post<{
    Body: {
      userId: number;
      name: string;
      amount: number;
      category?: string;
      description?: string;
      isActive?: boolean;
    };
  }>('/api/monthly-expenses', async (request, reply) => {
    const { userId, name, amount, category, description, isActive } =
      request.body;

    if (!userId || !name || amount === undefined) {
      return reply.code(400).send({ error: 'userId, name, and amount are required' });
    }

    const result = await db
      .insert(monthlyExpenses)
      .values({
        userId,
        name,
        amount,
        category: category || null,
        description: description || null,
        isActive: isActive !== undefined ? isActive : true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return reply.code(201).send(result[0]);
  });

  // Update monthly expense
  fastify.put<{
    Params: { id: string };
    Body: {
      name?: string;
      amount?: number;
      category?: string;
      description?: string;
      isActive?: boolean;
    };
  }>('/api/monthly-expenses/:id', async (request, reply) => {
    const { id } = request.params;
    const { name, amount, category, description, isActive } = request.body;

    // Check if expense exists
    const existing = await db
      .select()
      .from(monthlyExpenses)
      .where(eq(monthlyExpenses.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return reply.code(404).send({ error: 'Monthly expense not found' });
    }

    const updateData: any = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (amount !== undefined) updateData.amount = amount;
    if (category !== undefined) updateData.category = category;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;

    if (Object.keys(updateData).length === 1) {
      // Only updatedAt was set
      return reply.code(400).send({ error: 'No fields to update' });
    }

    const result = await db
      .update(monthlyExpenses)
      .set(updateData)
      .where(eq(monthlyExpenses.id, parseInt(id)))
      .returning();

    return reply.send(result[0]);
  });
}

