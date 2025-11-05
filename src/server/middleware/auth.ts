import { FastifyRequest, FastifyReply } from 'fastify';

// Simple session storage (in production, use Redis or a proper session store)
const sessions = new Map<string, { userId: number; expiresAt: number }>();

export interface AuthenticatedRequest extends FastifyRequest {
  userId?: number;
}

export async function authMiddleware(
  request: AuthenticatedRequest,
  reply: FastifyReply
): Promise<void> {
  const sessionId = request.headers['x-session-id'] as string;

  if (!sessionId) {
    return reply.code(401).send({ error: 'No session ID provided' });
  }

  const session = sessions.get(sessionId);

  if (!session) {
    return reply.code(401).send({ error: 'Invalid session' });
  }

  if (session.expiresAt < Date.now()) {
    sessions.delete(sessionId);
    return reply.code(401).send({ error: 'Session expired' });
  }

  request.userId = session.userId;
}

export function createSession(userId: number): string {
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

  sessions.set(sessionId, { userId, expiresAt });

  return sessionId;
}

export function deleteSession(sessionId: string): void {
  sessions.delete(sessionId);
}
