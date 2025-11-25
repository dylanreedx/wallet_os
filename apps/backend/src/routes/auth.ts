import { FastifyInstance } from 'fastify';
import { db } from '../db/index.js';
import { users, magicLinks, sessions } from '../db/dbSchema.js';
import { and, eq } from 'drizzle-orm';
import { createSession, deleteSession } from '../middleware/auth.js';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Derive a short, user-friendly login code from a magic link token
// This avoids schema changes by computing the code on the fly.
function deriveLoginCode(token: string): string {
  // Take a simple deterministic slice and normalize to uppercase
  // Format: XXX-XXX for better readability when typing on mobile
  const clean = token.replace(/-/g, '').toUpperCase();
  const part1 = clean.slice(0, 3);
  const part2 = clean.slice(3, 6);
  return `${part1}-${part2}`;
}

export async function authRoutes(fastify: FastifyInstance) {
  // Login - Generate Magic Link
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

    // 1. Find or create user (to capture name if provided)
    let user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (user.length === 0) {
      const insertUser = {
        email,
        name: name || null,
      };
      const newUser = await db
        .insert(users)
        .values(insertUser as any)
        .returning();
      user = newUser;
    } else if (name && user[0].name !== name) {
      // Update name if provided and different
      await db
        .update(users)
        .set({ name } as any)
        .where(eq(users.id, user[0].id));
    }

    // 2. Generate Magic Link Token
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await db.insert(magicLinks).values({
      email,
      token,
      expiresAt,
    });

    const loginCode = deriveLoginCode(token);

    // 3. Send Email
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const magicLinkUrl = `${frontendUrl}/auth/verify?token=${token}`;

    if (process.env.RESEND_API_KEY) {
      try {
        const { data, error } = await resend.emails.send({
          from: 'Wallet OS <onboarding@dylanreed.dev>',
          to: [email],
          subject: 'Login to Wallet OS',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Welcome to Wallet OS</h2>
              <p>Click the button below to securely log in to your account.</p>
              <a href="${magicLinkUrl}" style="display: inline-block; background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Log In</a>
              <p style="margin-top: 16px; font-size: 14px;">
                Or enter this code in the Wallet OS app if you have it installed:
                <strong style="font-size: 16px; letter-spacing: 2px;">${loginCode}</strong>
              </p>
              <p style="color: #666; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
            </div>
          `,
        });

        if (error) {
          console.error('Resend Error:', error);
          return reply.code(500).send({ error: 'Failed to send email' });
        }
      } catch (err) {
        console.error('Email sending failed:', err);
        return reply.code(500).send({ error: 'Failed to send email' });
      }
    } else {
      // Fallback for dev without API key
      console.log('=================================================');
      console.log('🔐 MAGIC LINK GENERATED (No API Key)');
      console.log(`📧 To: ${email}`);
      console.log(`🔗 Link: ${magicLinkUrl}`);
      console.log(`🔢 Login code: ${loginCode}`);
      console.log('=================================================');
    }

    return reply.send({
      message: 'Magic link sent',
      // Only return link in dev mode if NO api key is present
      mockLink:
        !process.env.RESEND_API_KEY && process.env.NODE_ENV === 'development'
          ? magicLinkUrl
          : undefined,
    });
  });

  // Verify Magic Link
  fastify.get<{
    Querystring: {
      token: string;
    };
  }>('/api/auth/verify', async (request, reply) => {
    const { token } = request.query;

    if (!token) {
      return reply.code(400).send({ error: 'Token is required' });
    }

    // 1. Find valid token
    const link = await db
      .select()
      .from(magicLinks)
      .where(eq(magicLinks.token, token))
      .limit(1);

    if (link.length === 0 || link[0].used || new Date() > link[0].expiresAt) {
      return reply.code(401).send({ error: 'Invalid or expired token' });
    }

    // 2. Mark token as used
    await db
      .update(magicLinks)
      .set({ used: true } as any)
      .where(eq(magicLinks.id, link[0].id));

    // 3. Get User
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, link[0].email))
      .limit(1);

    if (user.length === 0) {
      return reply.code(400).send({ error: 'User not found' });
    }

    // 4. Create Session
    const sessionId = await createSession(user[0].id);

    return reply.send({
      sessionId,
      user: user[0],
    });
  });

  // Verify login using short code (OTP-style) instead of clicking the magic link
  fastify.post<{
    Body: {
      email: string;
      code: string;
    };
  }>('/api/auth/verify-code', async (request, reply) => {
    const { email, code } = request.body;

    if (!email || !code) {
      return reply.code(400).send({ error: 'Email and code are required' });
    }

    // Normalize code format (e.g. "ABC123", "ABC-123", "abc-123")
    const normalizedCode = code.trim().toUpperCase().replace(/\s+/g, '');

    // 1. Fetch non-expired, unused links for this email
    const now = new Date();
    const links = await db
      .select()
      .from(magicLinks)
      .where(and(eq(magicLinks.email, email), eq(magicLinks.used, false)));

    if (links.length === 0) {
      return reply.code(401).send({ error: 'Invalid or expired code' });
    }

    // 2. Find a matching code derived from token
    const matching = links.find((link) => {
      if (new Date(link.expiresAt) <= now) return false;
      const derived = deriveLoginCode(link.token).replace(/-/g, '');
      return derived === normalizedCode.replace(/-/g, '');
    });

    if (!matching) {
      return reply.code(401).send({ error: 'Invalid or expired code' });
    }

    // 3. Mark token as used
    await db
      .update(magicLinks)
      .set({ used: true } as any)
      .where(eq(magicLinks.id, matching.id));

    // 4. Get User
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, matching.email))
      .limit(1);

    if (user.length === 0) {
      return reply.code(400).send({ error: 'User not found' });
    }

    // 5. Create Session
    const sessionId = await createSession(user[0].id);

    return reply.send({
      sessionId,
      user: user[0],
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
      await deleteSession(sessionId);
    }

    return reply.code(204).send();
  });

  // Validate session - checks if current session is still valid
  fastify.get<{
    Headers: {
      'x-session-id'?: string;
    };
  }>('/api/auth/validate', async (request, reply) => {
    const sessionId = request.headers['x-session-id'] as string;

    if (!sessionId) {
      return reply.code(401).send({ valid: false, error: 'No session' });
    }

    try {
      const sessionResults = await db
        .select()
        .from(sessions)
        .where(eq(sessions.id, sessionId))
        .limit(1);

      const session = sessionResults[0];

      if (!session) {
        return reply.code(401).send({ valid: false, error: 'Invalid session' });
      }

      if (session.expiresAt.getTime() < Date.now()) {
        // Clean up expired session
        await db.delete(sessions).where(eq(sessions.id, sessionId));
        return reply.code(401).send({ valid: false, error: 'Session expired' });
      }

      // Get user data for the valid session
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, session.userId))
        .limit(1);

      if (user.length === 0) {
        return reply.code(401).send({ valid: false, error: 'User not found' });
      }

      return reply.send({ valid: true, user: user[0] });
    } catch (error: any) {
      console.error('[AUTH] Session validation error:', error.message);
      return reply.code(401).send({ valid: false, error: 'Session validation failed' });
    }
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
        updatedAt: new Date(),
      } as any)
      .where(eq(users.id, userId))
      .returning();

    if (updated.length === 0) {
      return reply.code(404).send({ error: 'User not found' });
    }

    return reply.send({ monthlyIncome: updated[0].monthlyIncome });
  });

  // Update user profile (name, monthlyIncome) - used for onboarding
  fastify.patch<{
    Body: {
      userId: number;
      name?: string;
      monthlyIncome?: number;
    };
  }>('/api/auth/profile', async (request, reply) => {
    const { userId, name, monthlyIncome } = request.body;

    if (!userId) {
      return reply.code(400).send({ error: 'userId is required' });
    }

    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return reply.code(400).send({ error: 'Name must be a non-empty string' });
      }
      updateData.name = name.trim();
    }

    if (monthlyIncome !== undefined) {
      if (typeof monthlyIncome !== 'number' || monthlyIncome < 0) {
        return reply.code(400).send({ error: 'Monthly income must be a positive number' });
      }
      updateData.monthlyIncome = monthlyIncome;
    }

    const updated = await db
      .update(users)
      .set(updateData as any)
      .where(eq(users.id, userId))
      .returning();

    if (updated.length === 0) {
      return reply.code(404).send({ error: 'User not found' });
    }

    return reply.send({ user: updated[0] });
  });
}
