import { FastifyInstance } from 'fastify';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { createSession, deleteSession } from '../middleware/auth';

export async function authRoutes(fastify: FastifyInstance) {
  // Login (simplified - in production, add password hashing)
  fastify.post<{
    Body: {
      email: string;
      name?: string;
    };
  }>('/api/auth/login', async (request, reply) => {
    const { email, name } = request.body;

    if (!email) {
      return reply.code(400).send({ error: 'Email is required' });
    }

    // Find or create user
    let user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (user.length === 0) {
      // Create new user
      const newUser = await db
        .insert(users)
        .values({
          email,
          name: name || null,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      user = newUser;
    }

    const sessionId = createSession(user[0].id);

    return reply.send({
      sessionId,
      user: user[0]
    });
  });

  // Logout
  fastify.post<{
    Headers: {
      'x-session-id'?: string;
    };
  }>('/api/auth/logout', async (request, reply) => {
    const sessionId = request.headers['x-session-id'];

    if (sessionId) {
      deleteSession(sessionId);
    }

    return reply.code(204).send();
  });

  // Get user income
  fastify.get<{
    Querystring: {
      userId: string;
    };
  }>('/api/auth/income', async (request, reply) => {
    const { userId } = request.query;

    if (!userId) {
      return reply.code(400).send({ error: 'userId is required' });
    }

    const user = await db
      .select({ monthlyIncome: users.monthlyIncome })
      .from(users)
      .where(eq(users.id, parseInt(userId)))
      .limit(1);

    if (user.length === 0) {
      return reply.code(404).send({ error: 'User not found' });
    }

    return reply.send({ monthlyIncome: user[0].monthlyIncome || null });
  });

  // Update user income
  fastify.put<{
    Body: {
      userId: number;
      monthlyIncome: number;
    };
  }>('/api/auth/income', async (request, reply) => {
    const { userId, monthlyIncome } = request.body;

    if (!userId) {
      return reply.code(400).send({ error: 'userId is required' });
    }

    if (monthlyIncome === undefined || monthlyIncome < 0) {
      return reply.code(400).send({ error: 'Valid monthlyIncome is required' });
    }

    const updated = await db
      .update(users)
      .set({
        monthlyIncome,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();

    if (updated.length === 0) {
      return reply.code(404).send({ error: 'User not found' });
    }

    return reply.send({ monthlyIncome: updated[0].monthlyIncome });
  });
}
