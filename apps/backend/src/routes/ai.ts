import { FastifyInstance } from 'fastify';
import { aiService } from '../services/ai/AIService';
import { categorizationSkill } from '../services/ai/skills/CategorizationSkill';

export async function aiRoutes(fastify: FastifyInstance) {
  // Register skills
  aiService.registerSkill(categorizationSkill);

  fastify.post('/api/brain/categorize', async (request, reply) => {
    const { description, amount, date, userId } = request.body as any;

    if (!userId) {
      return reply.status(400).send({ error: 'userId is required' });
    }

    if (!description) {
      return reply.status(400).send({ error: 'Description is required' });
    }

    try {
      const category = await aiService.processIntent('categorize_expense', {
        description,
        amount,
        date,
        userId,
      });

      return { category };
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Failed to categorize expense' });
    }
  });
}
