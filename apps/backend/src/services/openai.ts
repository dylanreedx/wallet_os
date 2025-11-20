import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { db } from '../db';
import { expenses, goals, monthlyExpenses, users } from '../db';
import { eq, gte, lte, and } from 'drizzle-orm';

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ExpenseAnalysis {
  total: number;
  byCategory: Record<string, number>;
  averageDaily: number;
  trends: string[];
  monthlyIncome?: number;
  savingsRate?: number;
  availableAfterExpenses?: number;
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
  monthlyExpenses: {
    total: number;
    byCategory: Record<string, number>;
    items: Array<{
      id: number;
      name: string;
      amount: number;
      category: string | null;
      description: string | null;
    }>;
  };
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

  // Get user income
  const userData = await db
    .select({ monthlyIncome: users.monthlyIncome })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const monthlyIncome = userData[0]?.monthlyIncome || null;

  // Get active monthly expenses
  const activeMonthlyExpenses = await db
    .select()
    .from(monthlyExpenses)
    .where(and(eq(monthlyExpenses.userId, userId), eq(monthlyExpenses.isActive, true)));

  const totalMonthlyExpenses = activeMonthlyExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const monthlyExpensesByCategory: Record<string, number> = {};
  activeMonthlyExpenses.forEach((exp) => {
    const category = exp.category || 'Uncategorized';
    monthlyExpensesByCategory[category] = (monthlyExpensesByCategory[category] || 0) + exp.amount;
  });

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

  // Calculate income-based metrics
  const averageVariableExpenses = total / 3; // Average monthly variable expenses over 3 months
  const totalMonthlySpending = averageVariableExpenses + totalMonthlyExpenses; // Variable + Fixed
  const availableAfterExpenses = monthlyIncome
    ? monthlyIncome - totalMonthlySpending
    : null;
  const savingsRate =
    monthlyIncome && monthlyIncome > 0
      ? ((monthlyIncome - totalMonthlySpending) / monthlyIncome) * 100
      : null;

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

  const monthlyExpensesSummary = Object.entries(monthlyExpensesByCategory)
    .map(([cat, amount]) => `${cat}: $${amount.toFixed(2)}`)
    .join(', ');

  const prompt = `Analyze the following expense data and provide budget recommendations:

${
  monthlyIncome
    ? `Monthly Income: $${monthlyIncome.toFixed(2)}`
    : 'Income: Not provided'
}
Variable Expenses (last 3 months):
Total: $${total.toFixed(2)}
Average monthly: $${averageVariableExpenses.toFixed(2)}
Average daily: $${averageDaily.toFixed(2)}
By category: ${expensesSummary}

Fixed Monthly Expenses (recurring):
Total: $${totalMonthlyExpenses.toFixed(2)}
By category: ${monthlyExpensesSummary || 'None'}
${activeMonthlyExpenses.length > 0 ? `\nItems: ${activeMonthlyExpenses.map(e => `${e.name}: $${e.amount.toFixed(2)}`).join(', ')}` : ''}

Total Monthly Spending (Variable + Fixed): $${totalMonthlySpending.toFixed(2)}
${
  monthlyIncome
    ? `Available after expenses: $${
        availableAfterExpenses?.toFixed(2) || '0.00'
      }`
    : ''
}
${savingsRate !== null ? `Savings rate: ${savingsRate.toFixed(1)}%` : ''}

Current Goals:
${goalsSummary || 'No active goals'}

Please provide:
1. Spending trends and insights (2-3 sentences)${
    monthlyIncome ? ', including income vs expenses analysis' : ''
  }, noting the difference between fixed recurring expenses and variable spending
2. Budget suggestions for each category with recommended amounts${
    monthlyIncome ? ' (considering available income and fixed expenses)' : ''
  }
3. Specific recommendations for achieving the stated goals${
    monthlyIncome ? ' based on income, fixed expenses, and spending patterns' : ''
  }
4. Analysis of fixed vs variable expenses and recommendations for optimization

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
    // Use gpt-4o-mini for fast, cost-effective responses
    // If gpt-5-nano becomes available, update model name accordingly
    const result = await generateText({
      model: openai('gpt-4o-mini'),
      system: 'You are a financial advisor helping users manage their budgets and achieve financial goals.',
      prompt: prompt,
    });

    const response = JSON.parse(result.text || '{}');

    return {
      analysis: {
        total,
        byCategory,
        averageDaily,
        trends: response.trends || [],
        monthlyIncome: monthlyIncome || undefined,
        savingsRate: savingsRate !== null ? savingsRate : undefined,
        availableAfterExpenses:
          availableAfterExpenses !== null ? availableAfterExpenses : undefined,
      },
      monthlyExpenses: {
        total: totalMonthlyExpenses,
        byCategory: monthlyExpensesByCategory,
        items: activeMonthlyExpenses,
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
        monthlyIncome: monthlyIncome || undefined,
        savingsRate: savingsRate !== null ? savingsRate : undefined,
        availableAfterExpenses:
          availableAfterExpenses !== null ? availableAfterExpenses : undefined,
      },
      monthlyExpenses: {
        total: totalMonthlyExpenses,
        byCategory: monthlyExpensesByCategory,
        items: activeMonthlyExpenses,
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
