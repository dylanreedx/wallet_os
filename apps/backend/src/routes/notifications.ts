import { FastifyInstance } from 'fastify';
import { db } from '../db/index.js';
import { notifications } from '../db/dbSchema.js';
import { eq, desc, and } from 'drizzle-orm';

export async function notificationRoutes(fastify: FastifyInstance) {
  // Get user notifications
  fastify.get('/api/notifications', async (request, reply) => {
    // @ts-ignore
    const userId = request.user?.id;

    if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

    const userNotifications = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(50); // Limit to last 50 notifications

    return userNotifications;
  });

  // Mark notification as read
  fastify.put<{
    Params: { id: string };
  }>('/api/notifications/:id/read', async (request, reply) => {
    const { id } = request.params;
    // @ts-ignore
    const userId = request.user?.id;

    if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

    const result = await db
      .update(notifications)
      .set({ read: true } as any)
      .where(
        and(
          eq(notifications.id, parseInt(id)),
          eq(notifications.userId, userId)
        )
      );

    if (
      result === undefined ||
      (Array.isArray(result) && result.length === 0)
    ) {
      return reply.status(404).send({ error: 'Notification not found' });
    }

    return Array.isArray(result) ? result[0] : result;
  });

  // Mark all notifications as read
  fastify.put('/api/notifications/read-all', async (request, reply) => {
    // @ts-ignore
    const userId = request.user?.id;

    if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

    await db
      .update(notifications)
      .set({ read: true } as any)
      .where(eq(notifications.userId, userId));

    return { message: 'All notifications marked as read' };
  });
}
