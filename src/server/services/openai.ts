import OpenAI from 'openai';
import { db } from '../db';
import { expenses, goals } from '../db/schema';
import { eq, gte, lte } from 'drizzle-orm';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ExpenseAnalysis {
  total: number;
  byCategory: Record<string, number>;
  averageDaily: number;
  trends: string[];
}

interface BudgetSuggestion {
  category: string;
  suggestedAmount: number;
  currentSpending: number;
  recommendation: string;
}

export async function analyzeBudget(
  userId: number,
  month?: string
): Promise<{
  analysis: ExpenseAnalysis;
  suggestions: BudgetSuggestion[];
  goalRecommendations: string[];
}> {
  // Get date range for analysis (default to last 3 months)
  const endDate = month ? new Date(`${month}-01`) : new Date();
  const startDate = new Date(endDate);
  startDate.setMonth(startDate.getMonth() - 3);

  // Fetch expenses
  const userExpenses = await db
    .select()
    .from(expenses)
    .where(eq(expenses.userId, userId));

  const filteredExpenses = userExpenses.filter((exp) => {
    const expDate =
      typeof exp.date === 'number'
        ? new Date(exp.date * 1000)
        : new Date(exp.date);
    return expDate >= startDate && expDate <= endDate;
  });

  // Get user goals
  const userGoals = await db
    .select()
    .from(goals)
    .where(eq(goals.userId, userId));

  // Calculate basic statistics
  const total = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const byCategory: Record<string, number> = {};

  filteredExpenses.forEach((exp) => {
    const category = exp.category || 'Uncategorized';
    byCategory[category] = (byCategory[category] || 0) + exp.amount;
  });

  const days = Math.max(
    1,
    Math.floor(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    )
  );
  const averageDaily = total / days;

  // Prepare data for OpenAI
  const expensesSummary = Object.entries(byCategory)
    .map(([cat, amount]) => `${cat}: $${amount.toFixed(2)}`)
    .join(', ');

  const goalsSummary = userGoals
    .map(
      (g) =>
        `${g.name}: $${g.currentAmount}/${g.targetAmount} (deadline: ${g.deadline})`
    )
    .join('; ');

  const prompt = `Analyze the following expense data and provide budget recommendations:

Expenses (last 3 months):
Total: $${total.toFixed(2)}
Average daily: $${averageDaily.toFixed(2)}
By category: ${expensesSummary}

Current Goals:
${goalsSummary || 'No active goals'}

Please provide:
1. Spending trends and insights (2-3 sentences)
2. Budget suggestions for each category with recommended amounts
3. Specific recommendations for achieving the stated goals

Format the response as JSON with this structure:
{
  "trends": ["trend1", "trend2"],
  "suggestions": [
    {
      "category": "category name",
      "suggestedAmount": number,
      "currentSpending": number,
      "recommendation": "specific recommendation text"
    }
  ],
  "goalRecommendations": ["recommendation1", "recommendation2"]
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-5-nano',
      messages: [
        {
          role: 'system',
          content:
            'You are a financial advisor helping users manage their budgets and achieve financial goals.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const response = JSON.parse(completion.choices[0].message.content || '{}');

    return {
      analysis: {
        total,
        byCategory,
        averageDaily,
        trends: response.trends || [],
      },
      suggestions: response.suggestions || [],
      goalRecommendations: response.goalRecommendations || [],
    };
  } catch (error) {
    console.error('OpenAI API error:', error);

    // Fallback to basic suggestions if OpenAI fails
    return {
      analysis: {
        total,
        byCategory,
        averageDaily,
        trends: ['Reviewing spending patterns'],
      },
      suggestions: Object.entries(byCategory).map(([category, amount]) => ({
        category,
        suggestedAmount: amount * 0.9, // Suggest 10% reduction
        currentSpending: amount,
        recommendation: `Consider reducing ${category} spending by 10%`,
      })),
      goalRecommendations: userGoals.map(
        (g) =>
          `Save $${((g.targetAmount - g.currentAmount) / 3).toFixed(
            2
          )} per month to reach ${g.name} goal`
      ),
    };
  }
}
