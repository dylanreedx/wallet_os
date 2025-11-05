import { FastifyInstance } from 'fastify';
import { db } from '../db';
import { expenses } from '../db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

export async function expensesRoutes(fastify: FastifyInstance) {
  // Get all expenses for a user (with optional date range)
  fastify.get<{
    Querystring: {
      userId: string;
      startDate?: string;
      endDate?: string;
    };
  }>('/api/expenses', async (request, reply) => {
    const { userId, startDate, endDate } = request.query;

    if (!userId) {
      return reply.code(400).send({ error: 'userId is required' });
    }

    const conditions = [eq(expenses.userId, parseInt(userId))];
    
    if (startDate) {
      conditions.push(gte(expenses.date, new Date(startDate)));
    }
    
    if (endDate) {
      conditions.push(lte(expenses.date, new Date(endDate)));
    }

    const result = await db
      .select()
      .from(expenses)
      .where(and(...conditions))
      .orderBy(desc(expenses.date));

    return reply.send(result);
  });

  // Get single expense
  fastify.get<{
    Params: { id: string };
  }>('/api/expenses/:id', async (request, reply) => {
    const { id } = request.params;

    const result = await db
      .select()
      .from(expenses)
      .where(eq(expenses.id, parseInt(id)))
      .limit(1);

    if (result.length === 0) {
      return reply.code(404).send({ error: 'Expense not found' });
    }

    return reply.send(result[0]);
  });

  // Create expense
  fastify.post<{
    Body: {
      userId: number;
      amount: number;
      description: string;
      category?: string;
      date: string;
    };
  }>('/api/expenses', async (request, reply) => {
    const { userId, amount, description, category, date } = request.body;

    if (!userId || !amount || !description || !date) {
      return reply.code(400).send({ error: 'Missing required fields' });
    }

    const result = await db
      .insert(expenses)
      .values({
        userId,
        amount,
        description,
        category: category || null,
        date: new Date(date),
        createdAt: new Date()
      })
      .returning();

    return reply.code(201).send(result[0]);
  });

  // Update expense
  fastify.put<{
    Params: { id: string };
    Body: {
      amount?: number;
      description?: string;
      category?: string;
      date?: string;
    };
  }>('/api/expenses/:id', async (request, reply) => {
    const { id } = request.params;
    const { amount, description, category, date } = request.body;

    const updateData: any = {};
    if (amount !== undefined) updateData.amount = amount;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (date !== undefined) updateData.date = new Date(date);

    if (Object.keys(updateData).length === 0) {
      return reply.code(400).send({ error: 'No fields to update' });
    }

    const result = await db
      .update(expenses)
      .set(updateData)
      .where(eq(expenses.id, parseInt(id)))
      .returning();

    if (result.length === 0) {
      return reply.code(404).send({ error: 'Expense not found' });
    }

    return reply.send(result[0]);
  });

  // Delete expense
  fastify.delete<{
    Params: { id: string };
  }>('/api/expenses/:id', async (request, reply) => {
    const { id } = request.params;

    const result = await db
      .delete(expenses)
      .where(eq(expenses.id, parseInt(id)))
      .returning();

    if (result.length === 0) {
      return reply.code(404).send({ error: 'Expense not found' });
    }

    return reply.code(204).send();
  });
}
