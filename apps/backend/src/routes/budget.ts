import { FastifyInstance } from 'fastify';
import { analyzeBudget } from '../services/openai';
import { db } from '../db';
import { budgetSuggestions } from '../db';
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
      try {
        await db
          .insert(budgetSuggestions)
          .values({
            userId,
            month: analysisMonth,
            suggestions: JSON.stringify(result)
          })
          .onConflictDoUpdate({
            target: [budgetSuggestions.userId, budgetSuggestions.month],
            set: {
              suggestions: JSON.stringify(result)
            }
          });
        fastify.log.info(`Budget suggestions saved for user ${userId}, month ${analysisMonth}`);
      } catch (dbError) {
        // If database save fails, log detailed error but still return the analysis result
        const errorDetails = dbError instanceof Error 
          ? { message: dbError.message, name: dbError.name, stack: dbError.stack }
          : { error: String(dbError) };
        
        fastify.log.error({
          userId,
          month: analysisMonth,
          error: errorDetails,
          suggestionsSize: JSON.stringify(result).length
        }, 'Failed to save budget suggestions to database');
        
        // Log specific error types for debugging
        if (dbError instanceof Error) {
          if (dbError.message.includes('UNIQUE constraint')) {
            fastify.log.warn('Unique constraint violation - this should not happen with onConflictDoUpdate');
          } else if (dbError.message.includes('FOREIGN KEY constraint')) {
            fastify.log.error('Foreign key constraint violation - user may not exist');
          }
        }
      }

      return reply.send(result);
    } catch (error) {
      fastify.log.error(error, 'Budget analysis error');
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return reply.code(500).send({ 
        error: 'Failed to analyze budget',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      });
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
