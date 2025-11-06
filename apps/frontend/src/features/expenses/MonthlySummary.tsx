import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { expenses as expensesApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, TrendingUp, TrendingDown, Minus, Calendar, DollarSign, Activity, Clock } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, differenceInDays, parseISO, isAfter, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';

interface Expense {
  id: number;
  amount: number;
  date: string;
  category: string | null;
}

interface MonthlySummaryProps {
  defaultMonth?: string; // YYYY-MM format
  refreshTrigger?: number; // Increment to trigger refresh
}

export function MonthlySummary({ defaultMonth, refreshTrigger }: MonthlySummaryProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    defaultMonth || format(new Date(), 'yyyy-MM')
  );
  const [currentMonthData, setCurrentMonthData] = useState<{
    paidTotal: number;
    upcomingTotal: number;
    paidAverageDaily: number;
    daysInMonth: number;
    paidExpenseCount: number;
    upcomingExpenseCount: number;
    daysElapsed: number; // Days from start of month to today (or end of month if month is in the past)
  } | null>(null);
  const [previousMonthData, setPreviousMonthData] = useState<{
    paidTotal: number;
    averageDaily: number;
  } | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const fetchMonthlyData = async () => {
      try {
        setLoading(true);

        // Parse selected month
        const selectedDate = parseISO(`${selectedMonth}-01`);
        const monthStart = startOfMonth(selectedDate);
        const monthEnd = endOfMonth(selectedDate);
        const daysInMonth = differenceInDays(monthEnd, monthStart) + 1;

        // Get today's date (start of day for comparison)
        const today = startOfDay(new Date());
        const monthStartDay = startOfDay(monthStart);
        const monthEndDay = startOfDay(monthEnd);

        // Calculate days elapsed in the selected month
        // If month is in the future, daysElapsed = 0
        // If month is current, daysElapsed = days from month start to today
        // If month is in the past, daysElapsed = daysInMonth
        let daysElapsed = 0;
        if (isAfter(monthStartDay, today)) {
          daysElapsed = 0; // Future month
        } else if (isAfter(today, monthEndDay)) {
          daysElapsed = daysInMonth; // Past month
        } else {
          daysElapsed = differenceInDays(today, monthStartDay) + 1; // Current month
        }

        // Calculate previous month
        const prevMonthStart = startOfMonth(subMonths(selectedDate, 1));
        const prevMonthEnd = endOfMonth(subMonths(selectedDate, 1));

        // Fetch current month expenses
        const currentMonthExpenses = await expensesApi.getAll(
          user.id,
          format(monthStart, 'yyyy-MM-dd'),
          format(monthEnd, 'yyyy-MM-dd')
        );

        // Fetch previous month expenses
        const previousMonthExpenses = await expensesApi.getAll(
          user.id,
          format(prevMonthStart, 'yyyy-MM-dd'),
          format(prevMonthEnd, 'yyyy-MM-dd')
        );

        // Separate current month expenses into paid and upcoming
        const expensesArray = Array.isArray(currentMonthExpenses) ? currentMonthExpenses : [];
        const paidExpenses: Expense[] = [];
        const upcomingExpenses: Expense[] = [];

        expensesArray.forEach((expense: Expense) => {
          const expenseDate = startOfDay(parseISO(expense.date));
          // If expense date is today or in the past, it's paid
          // If expense date is in the future, it's upcoming
          if (isAfter(expenseDate, today)) {
            upcomingExpenses.push(expense);
          } else {
            paidExpenses.push(expense);
          }
        });

        // Calculate paid totals
        const paidTotal = paidExpenses.reduce((sum: number, expense: Expense) => sum + expense.amount, 0);
        const paidExpenseCount = paidExpenses.length;
        const paidAverageDaily = daysElapsed > 0 ? paidTotal / daysElapsed : 0;

        // Calculate upcoming totals
        const upcomingTotal = upcomingExpenses.reduce((sum: number, expense: Expense) => sum + expense.amount, 0);
        const upcomingExpenseCount = upcomingExpenses.length;

        setCurrentMonthData({
          paidTotal,
          upcomingTotal,
          paidAverageDaily,
          daysInMonth,
          paidExpenseCount,
          upcomingExpenseCount,
          daysElapsed,
        });

        // Calculate previous month totals (only paid expenses for past months)
        const prevExpensesArray = Array.isArray(previousMonthExpenses) ? previousMonthExpenses : [];
        const prevPaidTotal = prevExpensesArray.reduce((sum: number, expense: Expense) => {
          const expenseDate = startOfDay(parseISO(expense.date));
          // For past months, only count expenses that were actually paid (date <= month end)
          if (!isAfter(expenseDate, prevMonthEnd)) {
            return sum + expense.amount;
          }
          return sum;
        }, 0);
        const prevDaysInMonth = differenceInDays(prevMonthEnd, prevMonthStart) + 1;
        const prevAverageDaily = prevDaysInMonth > 0 ? prevPaidTotal / prevDaysInMonth : 0;

        setPreviousMonthData({
          paidTotal: prevPaidTotal,
          averageDaily: prevAverageDaily,
        });
      } catch (error) {
        console.error('Failed to load monthly summary:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMonthlyData();
  }, [user?.id, selectedMonth, refreshTrigger]);

  // Generate month options (last 12 months)
  const generateMonthOptions = () => {
    const options = [];
    const today = new Date();
    for (let i = 0; i < 12; i++) {
      const date = subMonths(today, i);
      const value = format(date, 'yyyy-MM');
      const label = format(date, 'MMMM yyyy');
      options.push({ value, label });
    }
    return options;
  };

  const monthOptions = generateMonthOptions();

  // Calculate trends (using paid totals only)
  const totalTrend = currentMonthData && previousMonthData
    ? currentMonthData.paidTotal - previousMonthData.paidTotal
    : 0;
  const averageDailyTrend = currentMonthData && previousMonthData
    ? currentMonthData.paidAverageDaily - previousMonthData.averageDaily
    : 0;

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-red-500" />;
    if (trend < 0) return <TrendingDown className="h-4 w-4 text-green-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getTrendColor = (trend: number) => {
    if (trend > 0) return 'text-red-500';
    if (trend < 0) return 'text-green-500';
    return 'text-muted-foreground';
  };

  const formatTrend = (trend: number) => {
    const abs = Math.abs(trend);
    if (abs < 0.01) return 'No change';
    return `$${abs.toFixed(2)} ${trend > 0 ? 'more' : 'less'}`;
  };

  if (loading) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl">Monthly Summary</CardTitle>
          </div>
          <CardDescription>Analyzing your monthly spending...</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
          <p className="text-sm text-muted-foreground">Loading monthly data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-2">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Monthly Summary</CardTitle>
              <CardDescription>Track your spending trends</CardDescription>
            </div>
          </div>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {currentMonthData ? (
          <>
            {/* Total Paid */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  <span>Total Paid</span>
                </div>
                {previousMonthData && (
                  <div className={cn('flex items-center gap-1.5 text-xs', getTrendColor(totalTrend))}>
                    {getTrendIcon(totalTrend)}
                    <span>{formatTrend(totalTrend)}</span>
                  </div>
                )}
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold tabular-nums">
                  ${currentMonthData.paidTotal.toFixed(2)}
                </p>
                {previousMonthData && (
                  <p className="text-sm text-muted-foreground">
                    vs ${previousMonthData.paidTotal.toFixed(2)} last month
                  </p>
                )}
              </div>
            </div>

            {/* Upcoming Expenses */}
            {currentMonthData.upcomingTotal > 0 && (
              <div className="space-y-2 rounded-lg border border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/30 p-4">
                <div className="flex items-center gap-2 text-sm text-orange-700 dark:text-orange-400">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">Upcoming Expenses</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-semibold tabular-nums text-orange-900 dark:text-orange-300">
                    ${currentMonthData.upcomingTotal.toFixed(2)}
                  </p>
                  <p className="text-sm text-orange-600 dark:text-orange-400">
                    ({currentMonthData.upcomingExpenseCount} scheduled)
                  </p>
                </div>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                  These expenses are scheduled for future dates and haven't been paid yet
                </p>
              </div>
            )}

            {/* Average Daily Spending (Paid) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Activity className="h-4 w-4" />
                  <span>Average Daily (Paid)</span>
                </div>
                {previousMonthData && (
                  <div className={cn('flex items-center gap-1.5 text-xs', getTrendColor(averageDailyTrend))}>
                    {getTrendIcon(averageDailyTrend)}
                    <span>{formatTrend(averageDailyTrend)}</span>
                  </div>
                )}
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-semibold tabular-nums">
                  ${currentMonthData.paidAverageDaily.toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground">
                  per day ({currentMonthData.paidExpenseCount} paid expenses)
                </p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className={cn(
              "grid gap-4 pt-4 border-t",
              currentMonthData.upcomingExpenseCount > 0 ? "grid-cols-3" : "grid-cols-2"
            )}>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Paid Expenses</p>
                <p className="text-lg font-semibold tabular-nums">
                  {currentMonthData.paidExpenseCount}
                </p>
              </div>
              {currentMonthData.upcomingExpenseCount > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Upcoming</p>
                  <p className="text-lg font-semibold tabular-nums text-orange-600 dark:text-orange-400">
                    {currentMonthData.upcomingExpenseCount}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Days Elapsed</p>
                <p className="text-lg font-semibold tabular-nums">
                  {currentMonthData.daysElapsed} / {currentMonthData.daysInMonth}
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
            <div className="rounded-full bg-muted p-4">
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">No data available</p>
              <p className="text-sm text-muted-foreground mt-1">
                Select a different month or add expenses to see your summary
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

