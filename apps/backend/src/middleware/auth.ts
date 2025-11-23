import { FastifyRequest, FastifyReply } from 'fastify';

// Simple session storage (in production, use Redis or a proper session store)
const sessions = new Map<string, { userId: number; expiresAt: number }>();

export interface AuthenticatedRequest extends FastifyRequest {
  user?: { id: number; name?: string };
}

export async function authMiddleware(
  request: AuthenticatedRequest,
  reply: FastifyReply
): Promise<void> {
  const sessionId = request.headers['x-session-id'] as string;

  console.log('[AUTH] Checking session:', sessionId ? `${sessionId.substring(0, 20)}...` : 'MISSING');

  if (!sessionId) {
    console.log('[AUTH] ❌ No session ID provided');
    return reply.code(401).send({ error: 'No session ID provided' });
  }

  const session = sessions.get(sessionId);

  if (!session) {
    console.log('[AUTH] ❌ Invalid session - not found in store');
    return reply.code(401).send({ error: 'Invalid session' });
  }

  if (session.expiresAt < Date.now()) {
    console.log('[AUTH] ❌ Session expired');
    sessions.delete(sessionId);
    return reply.code(401).send({ error: 'Session expired' });
  }

  console.log('[AUTH] ✅ Valid session for userId:', session.userId);
  // Set request.user to match what routes are checking for
  request.user = { id: session.userId };
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
