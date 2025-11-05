import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import { expensesRoutes } from './routes/expenses';
import { goalsRoutes } from './routes/goals';
import { goalItemsRoutes } from './routes/goalItems';
import { budgetRoutes } from './routes/budget';
import { socialRoutes } from './routes/social';
import { authRoutes } from './routes/auth';
import { monthlyExpensesRoutes } from './routes/monthlyExpenses';

dotenv.config();

const fastify = Fastify({
  logger: true
});

// Start server
const start = async () => {
  try {
    // Register plugins
    await fastify.register(cors, {
      origin: true,
      credentials: true
    });

    // Health check
    fastify.get('/api/health', async (request, reply) => {
      return { status: 'ok', timestamp: new Date().toISOString() };
    });

    // Register routes
    await fastify.register(authRoutes);
    await fastify.register(expensesRoutes);
    await fastify.register(goalsRoutes);
    await fastify.register(goalItemsRoutes);
    await fastify.register(budgetRoutes);
    await fastify.register(socialRoutes);
    await fastify.register(monthlyExpensesRoutes);

    const port = Number(process.env.PORT) || 3001;
    const host = process.env.HOST || '0.0.0.0';
    
    await fastify.listen({ port, host });
    console.log(`🚀 Server running on http://${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
