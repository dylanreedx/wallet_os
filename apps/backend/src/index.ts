import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
// Important for Node ESM on Vercel: use .js extensions so compiled output resolves correctly
import { expensesRoutes } from './routes/expenses.js';
import { goalsRoutes } from './routes/goals.js';
import { goalItemsRoutes } from './routes/goalItems.js';
import { budgetRoutes } from './routes/budget.js';
import { socialRoutes } from './routes/social.js';
import { authRoutes } from './routes/auth.js';
import { monthlyExpensesRoutes } from './routes/monthlyExpenses.js';
import { aiRoutes } from './routes/ai.js';
import { notificationRoutes } from './routes/notifications.js';
import { goalChatRoutes } from './routes/goalChats.js';
import { authMiddleware, cleanupExpiredSessions } from './middleware/auth.js';

dotenv.config();

const fastify = Fastify({
  logger: true,
});

// Start server
const start = async () => {
  try {
    // Register plugins
    await fastify.register(cors, {
      origin: true,
      credentials: true,
    });

    // Health check
    fastify.get('/api/health', async (request, reply) => {
      return { status: 'ok', timestamp: new Date().toISOString() };
    });

    // Clean up expired sessions on startup
    await cleanupExpiredSessions();

    // Register routes
    // Auth routes are public (they handle their own auth logic)
    await fastify.register(authRoutes);

    // All other routes require authentication; wrap them in a scope with the auth hook
    await fastify.register(async (protectedScope) => {
      protectedScope.addHook('onRequest', authMiddleware);

      await protectedScope.register(expensesRoutes);
      await protectedScope.register(goalsRoutes);
      await protectedScope.register(goalItemsRoutes);
      await protectedScope.register(budgetRoutes);
      await protectedScope.register(socialRoutes);
      await protectedScope.register(monthlyExpensesRoutes);
      await protectedScope.register(aiRoutes);
      await protectedScope.register(notificationRoutes);
      await protectedScope.register(goalChatRoutes);
    });

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
