import { db } from '../../db';
import { expenses, goals } from '../../db/dbSchema';
import { eq, desc } from 'drizzle-orm';

export class ContextEngine {
  async getUserContext(userId: number) {
    // Fetch recent expenses to understand spending habits
    const recentExpenses = await db
      .select()
      .from(expenses)
      .where(eq(expenses.userId, userId))
      .orderBy(desc(expenses.date))
      .limit(20);

    // Fetch active goals
    const activeGoals = await db
      .select()
      .from(goals)
      .where(eq(goals.userId, userId));

    return {
      recentExpenses,
      activeGoals,
      // Add more context here (location, time of day, etc.)
    };
  }
}

export const contextEngine = new ContextEngine();
