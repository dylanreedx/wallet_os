import { FastifyInstance } from 'fastify';
import { db } from '../db';
import { expenses, goals, goalItems } from '../db/dbSchema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

// Friendly, accessible color palette with strong borders and pastel backgrounds
const EXPENSE_COLORS = [
  { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E' }, // Amber
  { bg: '#DBEAFE', border: '#3B82F6', text: '#1E40AF' }, // Blue
  { bg: '#E9D5FF', border: '#A855F7', text: '#6B21A8' }, // Purple
  { bg: '#FCE7F3', border: '#EC4899', text: '#9F1239' }, // Pink
  { bg: '#D1FAE5', border: '#10B981', text: '#065F46' }, // Emerald
  { bg: '#FED7AA', border: '#F97316', text: '#9A3412' }, // Orange
  { bg: '#F3E8FF', border: '#9333EA', text: '#581C87' }, // Violet
  { bg: '#CCFBF1', border: '#14B8A6', text: '#134E4A' }, // Teal
  { bg: '#FEE2E2', border: '#EF4444', text: '#991B1B' }, // Red
  { bg: '#F0FDF4', border: '#22C55E', text: '#166534' }, // Green
];

function getRandomColor() {
  return EXPENSE_COLORS[Math.floor(Math.random() * EXPENSE_COLORS.length)];
}

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

  // Helper function to update goal progress from linked expenses
  async function updateGoalProgress(goalId: number) {
    const linkedExpenses = await db
      .select({
        total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`.as('total'),
      })
      .from(expenses)
      .where(eq(expenses.goalId, goalId));

    const newCurrentAmount = linkedExpenses[0]?.total || 0;

    await db
      .update(goals)
      .set({
        currentAmount: newCurrentAmount,
        updatedAt: new Date(),
      })
      .where(eq(goals.id, goalId));
  }

  // Create expense
  fastify.post<{
    Body: {
      userId: number;
      amount: number;
      description: string;
      category?: string;
      date: string;
      goalId?: number;
      goalItemId?: number;
    };
  }>('/api/expenses', async (request, reply) => {
    const { userId, amount, description, category, date, goalId, goalItemId } =
      request.body;

    if (!userId || !amount || !description || !date) {
      return reply.code(400).send({ error: 'Missing required fields' });
    }

    // Validate goalId and goalItemId if provided
    if (goalItemId && !goalId) {
      return reply
        .code(400)
        .send({ error: 'goalId is required when goalItemId is provided' });
    }

    if (goalItemId) {
      const item = await db
        .select()
        .from(goalItems)
        .where(eq(goalItems.id, goalItemId))
        .limit(1);

      if (item.length === 0 || item[0].goalId !== goalId) {
        return reply
          .code(400)
          .send({ error: 'Invalid goalItemId or goalId mismatch' });
      }
    }

    // Generate random color for new expense
    const colorData = getRandomColor();
    
    const result = await db
      .insert(expenses)
      .values({
        userId,
        amount,
        description,
        category: category || null,
        color: JSON.stringify(colorData), // Store as JSON string
        date: new Date(date),
        goalId: goalId || null,
        goalItemId: goalItemId || null,
      })
      .returning();

    // Update goal progress if linked
    if (goalId) {
      await updateGoalProgress(goalId);

      // Mark goal item as purchased if goalItemId provided
      if (goalItemId) {
        await db
          .update(goalItems)
          .set({ purchased: true })
          .where(eq(goalItems.id, goalItemId));
      }
    }

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
      goalId?: number | null;
      goalItemId?: number | null;
    };
  }>('/api/expenses/:id', async (request, reply) => {
    const { id } = request.params;
    const { amount, description, category, date, goalId, goalItemId } =
      request.body;

    // Get existing expense to track old goalId
    const existing = await db
      .select()
      .from(expenses)
      .where(eq(expenses.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return reply.code(404).send({ error: 'Expense not found' });
    }

    const oldGoalId = existing[0].goalId;
    const oldGoalItemId = existing[0].goalItemId;
    
    // If expense doesn't have a color, assign one
    const needsColor = !existing[0].color;
    const colorData = needsColor ? getRandomColor() : null;

    const updateData: any = {};
    if (amount !== undefined) updateData.amount = amount;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (date !== undefined) updateData.date = new Date(date);
    if (goalId !== undefined) updateData.goalId = goalId;
    if (goalItemId !== undefined) updateData.goalItemId = goalItemId;
    if (needsColor && colorData) updateData.color = JSON.stringify(colorData);

    if (Object.keys(updateData).length === 0) {
      return reply.code(400).send({ error: 'No fields to update' });
    }

    // Validate goalItemId if provided
    if (goalItemId !== null && goalItemId !== undefined) {
      if (!goalId && goalId !== null) {
        return reply
          .code(400)
          .send({ error: 'goalId is required when goalItemId is provided' });
      }

      if (goalId) {
        const item = await db
          .select()
          .from(goalItems)
          .where(eq(goalItems.id, goalItemId))
          .limit(1);

        if (item.length === 0 || item[0].goalId !== goalId) {
          return reply
            .code(400)
            .send({ error: 'Invalid goalItemId or goalId mismatch' });
        }
      }
    }

    const result = await db
      .update(expenses)
      .set(updateData)
      .where(eq(expenses.id, parseInt(id)))
      .returning();

    // Update goal progress for old and new goals
    if (oldGoalId) {
      await updateGoalProgress(oldGoalId);
    }
    if (goalId && goalId !== oldGoalId) {
      await updateGoalProgress(goalId);
    }

    // Mark goal item as purchased/unpurchased
    if (oldGoalItemId && oldGoalItemId !== goalItemId) {
      // Unmark old item if it's no longer linked
      const oldItemExpenses = await db
        .select()
        .from(expenses)
        .where(eq(expenses.goalItemId, oldGoalItemId))
        .limit(1);

      if (oldItemExpenses.length === 0) {
        await db
          .update(goalItems)
          .set({ purchased: false })
          .where(eq(goalItems.id, oldGoalItemId));
      }
    }

    if (goalItemId && goalItemId !== oldGoalItemId) {
      await db
        .update(goalItems)
        .set({ purchased: true })
        .where(eq(goalItems.id, goalItemId));
    }

    return reply.send(result[0]);
  });

  // Delete expense
  fastify.delete<{
    Params: { id: string };
  }>('/api/expenses/:id', async (request, reply) => {
    const { id } = request.params;

    // Get expense before deleting to update goal progress
    const existing = await db
      .select()
      .from(expenses)
      .where(eq(expenses.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return reply.code(404).send({ error: 'Expense not found' });
    }

    const goalId = existing[0].goalId;
    const goalItemId = existing[0].goalItemId;

    const result = await db
      .delete(expenses)
      .where(eq(expenses.id, parseInt(id)))
      .returning();

    // Update goal progress
    if (goalId) {
      await updateGoalProgress(goalId);

      // Unmark goal item if no other expenses are linked
      if (goalItemId) {
        const remainingExpenses = await db
          .select()
          .from(expenses)
          .where(eq(expenses.goalItemId, goalItemId))
          .limit(1);

        if (remainingExpenses.length === 0) {
          await db
            .update(goalItems)
            .set({ purchased: false })
            .where(eq(goalItems.id, goalItemId));
        }
      }
    }

    return reply.code(204).send();
  });
}
