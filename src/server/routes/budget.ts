import { FastifyInstance } from 'fastify';
import { analyzeBudget } from '../services/openai';
import { db } from '../db';
import { budgetSuggestions } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export async function budgetRoutes(fastify: FastifyInstance) {
  // Analyze budget and get suggestions
  fastify.post<{
    Body: {
      userId: number;
      month?: string;
    };
  }>('/api/budget/analyze', async (request, reply) => {
    const { userId, month } = request.body;

    if (!userId) {
      return reply.code(400).send({ error: 'userId is required' });
    }

    try {
      const result = await analyzeBudget(userId, month);

      // Save suggestion to database
      const analysisMonth = month || new Date().toISOString().slice(0, 7);
      await db
        .insert(budgetSuggestions)
        .values({
          userId,
          month: analysisMonth,
          suggestions: JSON.stringify(result),
          createdAt: new Date()
        })
        .onConflictDoUpdate({
          target: [budgetSuggestions.userId, budgetSuggestions.month],
          set: {
            suggestions: JSON.stringify(result),
            createdAt: new Date()
          }
        });

      return reply.send(result);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to analyze budget' });
    }
  });

  // Get saved budget suggestions
  fastify.get<{
    Querystring: {
      userId: string;
      month?: string;
    };
  }>('/api/budget/suggestions', async (request, reply) => {
    const { userId, month } = request.query;

    if (!userId) {
      return reply.code(400).send({ error: 'userId is required' });
    }

    const conditions = [eq(budgetSuggestions.userId, parseInt(userId))];
    
    if (month) {
      conditions.push(eq(budgetSuggestions.month, month));
    }

    const result = await db
      .select()
      .from(budgetSuggestions)
      .where(and(...conditions));

    return reply.send(result.map(r => ({
      ...r,
      suggestions: JSON.parse(r.suggestions)
    })));
  });
}
