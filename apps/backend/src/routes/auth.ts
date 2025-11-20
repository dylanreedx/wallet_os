import { FastifyInstance } from 'fastify';
import { db } from '../db';
import { users, magicLinks } from '../db/dbSchema';
import { eq } from 'drizzle-orm';
import { createSession, deleteSession } from '../middleware/auth';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

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
    } else if (name && user[0].name !== name) {
      // Update name if provided and different
      await db.update(users).set({ name }).where(eq(users.id, user[0].id));
    }

    // 2. Generate Magic Link Token
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await db.insert(magicLinks).values({
      email,
      token,
      expiresAt,
    });

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
              <p style="color: #666; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
            </div>
          `
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
      console.log('=================================================');
    }

    return reply.send({ 
      message: 'Magic link sent',
      // Only return link in dev mode if NO api key is present
      mockLink: (!process.env.RESEND_API_KEY && process.env.NODE_ENV === 'development') ? magicLinkUrl : undefined 
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
      .set({ used: true })
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
