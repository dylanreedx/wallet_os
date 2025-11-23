import { FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db/index.js';
import { sessions } from '../db/dbSchema.js';
import { eq, and, lt } from 'drizzle-orm';

export interface AuthenticatedRequest extends FastifyRequest {
  user?: { id: number; name?: string };
}

export async function authMiddleware(
  request: AuthenticatedRequest,
  reply: FastifyReply
): Promise<void> {
  const sessionId = request.headers['x-session-id'] as string;

  console.log(
    '[AUTH] Checking session:',
    sessionId ? `${sessionId.substring(0, 20)}...` : 'MISSING'
  );

  if (!sessionId) {
    console.log('[AUTH] ❌ No session ID provided');
    return reply.code(401).send({ error: 'No session ID provided' });
  }

  // Check session in database
  let session;
  try {
    const sessionResults = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .limit(1);

    session = sessionResults[0] || null;
  } catch (error: any) {
    // If table doesn't exist yet (migration not run), log and fail gracefully
    console.error('[AUTH] ❌ Database error checking session:', error.message);
    if (
      error.message?.includes('no such table') ||
      error.message?.includes('does not exist')
    ) {
      console.log('[AUTH] ⚠️ Sessions table does not exist - migration needed');
      return reply.code(401).send({
        error: 'Invalid session',
        hint: 'Database migration required - sessions table missing',
      });
    }
    return reply.code(401).send({ error: 'Invalid session' });
  }

  if (!session) {
    console.log('[AUTH] ❌ Invalid session - not found in database');
    console.log(
      '[AUTH] 💡 This session was likely created before database migration. User needs to log out and log back in.'
    );
    return reply.code(401).send({
      error: 'Invalid session',
      message:
        'Session not found. Please log out and log back in to create a new session.',
    });
  }

  if (session.expiresAt.getTime() < Date.now()) {
    console.log('[AUTH] ❌ Session expired');
    // Clean up expired session
    await db.delete(sessions).where(eq(sessions.id, sessionId));
    return reply.code(401).send({ error: 'Session expired' });
  }

  console.log('[AUTH] ✅ Valid session for userId:', session.userId);
  // Set request.user to match what routes are checking for
  request.user = { id: session.userId };
}

export async function createSession(userId: number): Promise<string> {
  const sessionId = `session_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`;
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await db.insert(sessions).values({
    id: sessionId,
    userId,
    expiresAt,
  });

  return sessionId;
}

export async function deleteSession(sessionId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.id, sessionId));
}

// Clean up expired sessions periodically (optional, can be called on startup)
export async function cleanupExpiredSessions(): Promise<void> {
  const now = new Date();
  await db.delete(sessions).where(lt(sessions.expiresAt, now));
}
