import { FastifyInstance } from 'fastify';
import { db } from '../db/index.js';
import {
  goalChats,
  users,
  sharedGoals,
  goals,
  notifications,
  NewNotification,
} from '../db/dbSchema.js';
import { eq, asc, and, inArray, ne } from 'drizzle-orm';

export async function goalChatRoutes(fastify: FastifyInstance) {
  // Get chat messages for a goal
  fastify.get<{
    Params: { goalId: string };
  }>('/api/goals/:goalId/chat', async (request, reply) => {
    const { goalId } = request.params;
    // @ts-ignore
    const userId = request.user?.id;

    if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

    const goalIdInt = parseInt(goalId);

    // Check access
    const goal = await db.query.goals.findFirst({
      where: eq(goals.id, goalIdInt),
    });

    if (!goal) return reply.status(404).send({ error: 'Goal not found' });

    if (goal.userId !== userId) {
      const shared = await db.query.sharedGoals.findFirst({
        where: and(
          eq(sharedGoals.goalId, goalIdInt),
          eq(sharedGoals.userId, userId)
        ),
      });

      if (!shared) return reply.status(403).send({ error: 'Access denied' });
    }

    const messages = await db
      .select({
        id: goalChats.id,
        message: goalChats.message,
        createdAt: goalChats.createdAt,
        userId: users.id,
        userName: users.name,
      })
      .from(goalChats)
      .innerJoin(users, eq(goalChats.userId, users.id))
      .where(eq(goalChats.goalId, goalIdInt))
      .orderBy(asc(goalChats.createdAt));

    return messages;
  });

  // Post a chat message
  fastify.post<{
    Params: { goalId: string };
    Body: { message: string };
  }>('/api/goals/:goalId/chat', async (request, reply) => {
    const { goalId } = request.params;
    const { message } = request.body;
    // @ts-ignore
    const userId = request.user?.id;
    // @ts-ignore
    const userName = request.user?.name || 'Someone';

    if (!userId) return reply.status(401).send({ error: 'Unauthorized' });
    if (!message)
      return reply.status(400).send({ error: 'Message is required' });

    const goalIdInt = parseInt(goalId);

    // Check access
    const goal = await db.query.goals.findFirst({
      where: eq(goals.id, goalIdInt),
    });

    if (!goal) return reply.status(404).send({ error: 'Goal not found' });

    let hasAccess = false;
    if (goal.userId === userId) {
      hasAccess = true;
    } else {
      const shared = await db.query.sharedGoals.findFirst({
        where: and(
          eq(sharedGoals.goalId, goalIdInt),
          eq(sharedGoals.userId, userId)
        ),
      });
      if (shared) hasAccess = true;
    }

    if (!hasAccess) return reply.status(403).send({ error: 'Access denied' });

    // Create message
    const newMessage = await db
      .insert(goalChats)
      .values({
        goalId: goalIdInt,
        userId,
        message,
      })
      .returning();

    // Notify other participants
    // 1. Get all participants
    const participants = await db
      .select({ userId: sharedGoals.userId })
      .from(sharedGoals)
      .where(eq(sharedGoals.goalId, goalIdInt));

    const participantIds = participants.map((p) => p.userId);
    if (goal.userId !== userId) participantIds.push(goal.userId);

    // Filter out sender
    const recipients = participantIds.filter((id) => id !== userId);

    if (recipients.length > 0) {
      // Create notifications
      // Note: In a real app, we might batch this or use a job queue
      for (const recipientId of recipients) {
        const chatNotification: NewNotification = {
          userId: recipientId,
          type: 'chat_message',
          title: `New message in ${goal.name}`,
          message: `${userName}: ${message}`,
          link: `/goals/${goalIdInt}`,
        };

        await db.insert(notifications).values(chatNotification);
      }
    }

    return newMessage[0];
  });
}
