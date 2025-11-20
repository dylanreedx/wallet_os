import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useBudgetSuggestions, useAnalyzeBudget } from '@/hooks/useBudget';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface BudgetAnalysisResponse {
  analysis: {
    total: number;
    byCategory: Record<string, number>;
    averageDaily: number;
    trends: string[];
    monthlyIncome?: number;
    savingsRate?: number;
    availableAfterExpenses?: number;
  };
  monthlyExpenses?: {
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
  suggestions: Array<{
    category: string;
    suggestedAmount: number;
    currentSpending: number;
    recommendation: string;
  }>;
  goalRecommendations: string[];
}

interface SavedAnalysis {
  id: number;
  userId: number;
  month: string;
  suggestions: BudgetAnalysisResponse;
  createdAt: string;
}

export default function BudgetPage() {
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<BudgetAnalysisResponse | null>(null);

  // Fetch saved analyses using TanStack Query
  const { data: savedAnalyses = [], isLoading: loadingSaved } = useBudgetSuggestions({
    userId: user?.id,
  });

  const analyzeBudgetMutation = useAnalyzeBudget();

  const handleAnalyze = async () => {
    if (!user?.id) {
      setError('Please log in to analyze your budget');
      return;
    }

    setError(null);
    setResults(null);

    try {
      const data = await analyzeBudgetMutation.mutateAsync({ userId: user.id });
      setResults(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to analyze budget'
      );
    }
  };

  const handleLoadSavedAnalysis = (savedAnalysis: SavedAnalysis) => {
    setResults(savedAnalysis.suggestions);
  };

  return (
    <div className="min-h-screen p-4 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Budget Analysis</h1>
          <p className="text-muted-foreground">AI-powered budget insights</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Run Analysis</CardTitle>
            <CardDescription>
              Get AI-powered insights about your spending patterns and budget
              recommendations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleAnalyze}
              disabled={analyzeBudgetMutation.isPending || !user?.id}
              className="w-full"
            >
              {analyzeBudgetMutation.isPending ? 'Analyzing...' : 'Analyze Budget'}
            </Button>

            {savedAnalyses.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">View Previous Analysis</label>
                <Select
                  onValueChange={(value) => {
                    const selected = savedAnalyses.find(
                      (a: any) => a.id.toString() === value
                    );
                    if (selected) {
                      handleLoadSavedAnalysis(selected);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a previous analysis" />
                  </SelectTrigger>
                  <SelectContent>
                    {savedAnalyses.map((analysis: any) => {
                      const date = new Date(analysis.createdAt);
                      const monthName = date.toLocaleDateString('en-US', {
                        month: 'long',
                        year: 'numeric',
                      });
                      return (
                        <SelectItem
                          key={analysis.id}
                          value={analysis.id.toString()}
                        >
                          {monthName} ({analysis.month})
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {results && (
          <div className="space-y-6">
            {/* Analysis Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Analysis Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {results.analysis.monthlyIncome && (
                  <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                    <div>
                      <p className="text-sm text-muted-foreground">Monthly Income</p>
                      <p className="text-2xl font-bold text-green-600">
                        ${results.analysis.monthlyIncome.toFixed(2)}
                      </p>
                    </div>
                    {results.analysis.availableAfterExpenses !== undefined && (
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Available After Expenses
                        </p>
                        <p
                          className={`text-2xl font-bold ${
                            results.analysis.availableAfterExpenses >= 0
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          ${results.analysis.availableAfterExpenses.toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Variable Spending</p>
                    <p className="text-2xl font-bold">
                      ${results.analysis.total.toFixed(2)}
                    </p>
                    {results.analysis.monthlyIncome && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Avg: ${(results.analysis.total / 3).toFixed(2)}/month
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Average Daily</p>
                    <p className="text-2xl font-bold">
                      ${results.analysis.averageDaily.toFixed(2)}
                    </p>
                    {results.analysis.savingsRate !== undefined && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Savings Rate: {results.analysis.savingsRate.toFixed(1)}%
                      </p>
                    )}
                  </div>
                </div>

                {results.monthlyExpenses && results.monthlyExpenses.total > 0 && (
                  <div className="pt-4 border-t">
                    <p className="text-sm font-semibold mb-2">Fixed Monthly Expenses</p>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Total Fixed</span>
                        <span className="font-semibold">
                          ${results.monthlyExpenses.total.toFixed(2)}/month
                        </span>
                      </div>
                      {Object.entries(results.monthlyExpenses.byCategory).length > 0 && (
                        <div className="space-y-1 mt-2">
                          {Object.entries(results.monthlyExpenses.byCategory).map(
                            ([category, amount]) => (
                              <div
                                key={category}
                                className="flex justify-between text-sm"
                              >
                                <span className="text-muted-foreground">{category}</span>
                                <span className="font-medium">${amount.toFixed(2)}</span>
                              </div>
                            )
                          )}
                        </div>
                      )}
                      {results.monthlyExpenses.items.length > 0 && (
                        <div className="mt-3 space-y-1">
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            Items:
                          </p>
                          {results.monthlyExpenses.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex justify-between text-xs text-muted-foreground"
                            >
                              <span>{item.name}</span>
                              <span>${item.amount.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {results.analysis.trends && results.analysis.trends.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold mb-2">Spending Trends</p>
                    <ul className="space-y-1">
                      {results.analysis.trends.map((trend, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground">
                          • {trend}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {Object.keys(results.analysis.byCategory).length > 0 && (
                  <div>
                    <p className="text-sm font-semibold mb-2">By Category</p>
                    <div className="space-y-2">
                      {Object.entries(results.analysis.byCategory).map(
                        ([category, amount]) => (
                          <div
                            key={category}
                            className="flex justify-between text-sm"
                          >
                            <span className="text-muted-foreground">
                              {category}
                            </span>
                            <span className="font-medium">
                              ${amount.toFixed(2)}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Budget Suggestions */}
            {results.suggestions && results.suggestions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Budget Suggestions</CardTitle>
                  <CardDescription>
                    AI recommendations for optimizing your spending
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {results.suggestions.map((suggestion, idx) => {
                    const difference =
                      suggestion.suggestedAmount - suggestion.currentSpending;
                    const isIncrease = difference > 0;
                    const percentChange =
                      (Math.abs(difference) / suggestion.currentSpending) *
                      100;

                    return (
                      <div
                        key={idx}
                        className="border rounded-lg p-4 space-y-2"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">{suggestion.category}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {suggestion.recommendation}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Current
                            </p>
                            <p className="font-medium">
                              ${suggestion.currentSpending.toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Suggested
                            </p>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">
                                ${suggestion.suggestedAmount.toFixed(2)}
                              </p>
                              <span
                                className={`text-xs ${
                                  isIncrease
                                    ? 'text-green-600'
                                    : 'text-orange-600'
                                }`}
                              >
                                {isIncrease ? '↑' : '↓'}{' '}
                                {percentChange.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Goal Recommendations */}
            {results.goalRecommendations &&
              results.goalRecommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Goal Recommendations</CardTitle>
                    <CardDescription>
                      Specific recommendations for achieving your goals
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {results.goalRecommendations.map((rec, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-sm"
                        >
                          <span className="text-primary mt-1">•</span>
                          <span className="text-muted-foreground">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
          </div>
        )}
      </div>
    </div>
  );
}
