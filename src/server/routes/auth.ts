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
}
