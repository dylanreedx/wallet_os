import { useEffect, useState, useRef, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useExpenses } from '@/hooks/useExpenses';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  DollarSign,
  Activity,
  Clock,
  ChevronDown,
} from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
  differenceInDays,
  parseISO,
  isAfter,
  startOfDay,
} from 'date-fns';
import { cn } from '@/lib/utils';



interface MonthlySummaryProps {
  defaultMonth?: string; // YYYY-MM format
  refreshTrigger?: number; // Increment to trigger refresh
}

export function MonthlySummary({
  defaultMonth,
  refreshTrigger,
}: MonthlySummaryProps) {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState<string>(
    defaultMonth || format(new Date(), 'yyyy-MM')
  );
  const [collapsed, setCollapsed] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentMaxHeight, setContentMaxHeight] = useState<number | 'none'>(0);

  // Calculate date ranges
  const { currentMonthStart, currentMonthEnd, prevMonthStart, prevMonthEnd } = useMemo(() => {
    const selectedDate = parseISO(`${selectedMonth}-01`);
    return {
      currentMonthStart: format(startOfMonth(selectedDate), 'yyyy-MM-dd'),
      currentMonthEnd: format(endOfMonth(selectedDate), 'yyyy-MM-dd'),
      prevMonthStart: format(startOfMonth(subMonths(selectedDate, 1)), 'yyyy-MM-dd'),
      prevMonthEnd: format(endOfMonth(subMonths(selectedDate, 1)), 'yyyy-MM-dd'),
    };
  }, [selectedMonth]);

  // Fetch expenses using TanStack Query
  const { data: currentMonthExpenses = [], isLoading: currentLoading } = useExpenses({
    userId: user?.id,
    startDate: currentMonthStart,
    endDate: currentMonthEnd,
  });

  const { data: previousMonthExpenses = [], isLoading: prevLoading } = useExpenses({
    userId: user?.id,
    startDate: prevMonthStart,
    endDate: prevMonthEnd,
  });

  const loading = currentLoading || prevLoading;

  // Calculate monthly data from fetched expenses
  const { currentMonthData, previousMonthData } = useMemo(() => {
    const selectedDate = parseISO(`${selectedMonth}-01`);
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const daysInMonth = differenceInDays(monthEnd, monthStart) + 1;
    const today = startOfDay(new Date());
    const monthStartDay = startOfDay(monthStart);
    const monthEndDay = startOfDay(monthEnd);

    let daysElapsed = 0;
    if (isAfter(monthStartDay, today)) {
      daysElapsed = 0;
    } else if (isAfter(today, monthEndDay)) {
      daysElapsed = daysInMonth;
    } else {
      daysElapsed = differenceInDays(today, monthStartDay) + 1;
    }

    const paidExpenses = currentMonthExpenses.filter((expense: any) => {
      const expenseDate = startOfDay(parseISO(expense.date));
      return !isAfter(expenseDate, today);
    });

    const upcomingExpenses = currentMonthExpenses.filter((expense: any) => {
      const expenseDate = startOfDay(parseISO(expense.date));
      return isAfter(expenseDate, today);
    });

    const paidTotal = paidExpenses.reduce((sum: number, expense: any) => sum + expense.amount, 0);
    const upcomingTotal = upcomingExpenses.reduce((sum: number, expense: any) => sum + expense.amount, 0);
    const paidAverageDaily = daysElapsed > 0 ? paidTotal / daysElapsed : 0;

    const prevMonthEnd = endOfMonth(subMonths(selectedDate, 1));
    const prevPaidTotal = previousMonthExpenses.reduce((sum: number, expense: any) => {
      const expenseDate = startOfDay(parseISO(expense.date));
      if (!isAfter(expenseDate, prevMonthEnd)) {
        return sum + expense.amount;
      }
      return sum;
    }, 0);

    const prevMonthStart = startOfMonth(subMonths(selectedDate, 1));
    const prevDaysInMonth = differenceInDays(prevMonthEnd, prevMonthStart) + 1;
    const prevAverageDaily = prevDaysInMonth > 0 ? prevPaidTotal / prevDaysInMonth : 0;

    return {
      currentMonthData: {
        paidTotal,
        upcomingTotal,
        paidAverageDaily,
        daysInMonth,
        paidExpenseCount: paidExpenses.length,
        upcomingExpenseCount: upcomingExpenses.length,
        daysElapsed,
      },
      previousMonthData: {
        paidTotal: prevPaidTotal,
        averageDaily: prevAverageDaily,
      },
    };
  }, [currentMonthExpenses, previousMonthExpenses, selectedMonth]);

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
  const totalTrend =
    currentMonthData && previousMonthData
      ? currentMonthData.paidTotal - previousMonthData.paidTotal
      : 0;
  const averageDailyTrend =
    currentMonthData && previousMonthData
      ? currentMonthData.paidAverageDaily - previousMonthData.averageDaily
      : 0;

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="h-3 w-3 text-red-500" />;
    if (trend < 0) return <TrendingDown className="h-3 w-3 text-green-500" />;
    return <Minus className="h-3 w-3 text-muted-foreground" />;
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

  // Handle collapse/expand animation
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    if (collapsed) {
      // Ensure we set an explicit height before collapsing to animate
      setContentMaxHeight(el.scrollHeight);
      // next tick collapse
      requestAnimationFrame(() => setContentMaxHeight(0));
      return;
    }
    // Expanding: animate to measured height, then release to 'auto' (none)
    setContentMaxHeight(el.scrollHeight);
    const id = window.setTimeout(() => setContentMaxHeight('none'), 300);
    return () => window.clearTimeout(id);
  }, [collapsed, currentMonthData]);

  useEffect(() => {
    if (collapsed) return;
    const onResize = () => {
      if (contentRef.current) {
        setContentMaxHeight(contentRef.current.scrollHeight);
        const id = window.setTimeout(() => setContentMaxHeight('none'), 200);
        window.setTimeout(() => window.clearTimeout(id), 0);
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [collapsed]);

  if (loading) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Monthly Summary</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Analyzing your monthly spending...
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
          <p className="text-xs text-muted-foreground">
            Loading monthly data...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-1.5">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Monthly Summary</CardTitle>
              <CardDescription className="text-xs">
                Track your spending trends
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[130px] h-8 text-xs">
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
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCollapsed((v) => !v)}
              className={cn(
                'h-8 w-8 transition-all duration-300 ease-in-out',
                !collapsed && 'rotate-180'
              )}
              aria-expanded={!collapsed}
              aria-label={collapsed ? 'Expand' : 'Collapse'}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Compact View - Truly minimal, just the amount */}
      {collapsed && currentMonthData && (
        <CardContent className="py-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Total Paid</span>
            <p className="text-lg font-bold tabular-nums">
              ${currentMonthData.paidTotal.toFixed(2)}
            </p>
          </div>
        </CardContent>
      )}

      {/* Expanded View */}
      <CardContent
        className={cn(
          'transition-all duration-300 ease-in-out overflow-hidden',
          collapsed && 'hidden'
        )}
        style={{
          maxHeight: collapsed
            ? 0
            : contentMaxHeight === 'none'
            ? 'none'
            : `${contentMaxHeight}px`,
          opacity: collapsed ? 0 : 1,
        }}
      >
        <div ref={contentRef} className="space-y-3">
          {currentMonthData ? (
            <>
              {/* Total Paid */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <DollarSign className="h-3.5 w-3.5" />
                    <span>Total Paid</span>
                  </div>
                  {previousMonthData && (
                    <div
                      className={cn(
                        'flex items-center gap-1 text-[10px]',
                        getTrendColor(totalTrend)
                      )}
                    >
                      {getTrendIcon(totalTrend)}
                      <span>{formatTrend(totalTrend)}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold tabular-nums">
                    ${currentMonthData.paidTotal.toFixed(2)}
                  </p>
                  {previousMonthData && (
                    <p className="text-xs text-muted-foreground">
                      vs ${previousMonthData.paidTotal.toFixed(2)} last month
                    </p>
                  )}
                </div>
              </div>

              {/* Upcoming Expenses */}
              {currentMonthData.upcomingTotal > 0 && (
                <div className="space-y-1 rounded-lg border border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/30 p-2.5">
                  <div className="flex items-center gap-1.5 text-xs text-orange-700 dark:text-orange-400">
                    <Clock className="h-3.5 w-3.5" />
                    <span className="font-medium">Scheduled Expenses</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className="text-xl font-semibold tabular-nums text-orange-900 dark:text-orange-300">
                      ${currentMonthData.upcomingTotal.toFixed(2)}
                    </p>
                    <p className="text-xs text-orange-600 dark:text-orange-400">
                      ({currentMonthData.upcomingExpenseCount})
                    </p>
                  </div>
                </div>
              )}

              {/* Average Daily Spending (Paid) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Activity className="h-3.5 w-3.5" />
                    <span>Average Daily (Paid)</span>
                  </div>
                  {previousMonthData && (
                    <div
                      className={cn(
                        'flex items-center gap-1 text-[10px]',
                        getTrendColor(averageDailyTrend)
                      )}
                    >
                      {getTrendIcon(averageDailyTrend)}
                      <span>{formatTrend(averageDailyTrend)}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-xl font-semibold tabular-nums">
                    ${currentMonthData.paidAverageDaily.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    per day ({currentMonthData.paidExpenseCount} paid)
                  </p>
                </div>
              </div>

              {/* Stats Grid */}
              <div
                className={cn(
                  'grid gap-2 pt-2 border-t',
                  currentMonthData.upcomingExpenseCount > 0
                    ? 'grid-cols-3'
                    : 'grid-cols-2'
                )}
              >
                <div>
                  <p className="text-[10px] text-muted-foreground mb-0.5">
                    Paid Expenses
                  </p>
                  <p className="text-base font-semibold tabular-nums">
                    {currentMonthData.paidExpenseCount}
                  </p>
                </div>
                {currentMonthData.upcomingExpenseCount > 0 && (
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-0.5">
                      Upcoming
                    </p>
                    <p className="text-base font-semibold tabular-nums text-orange-600 dark:text-orange-400">
                      {currentMonthData.upcomingExpenseCount}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-[10px] text-muted-foreground mb-0.5">
                    Days Elapsed
                  </p>
                  <p className="text-base font-semibold tabular-nums">
                    {currentMonthData.daysElapsed} /{' '}
                    {currentMonthData.daysInMonth}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
              <div className="rounded-full bg-muted p-3">
                <Calendar className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs font-medium">No data available</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Select a different month or add expenses to see your summary
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
