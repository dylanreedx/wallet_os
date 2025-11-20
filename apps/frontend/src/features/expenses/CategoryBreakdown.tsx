import { useEffect, useRef, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useExpenses } from '@/hooks/useExpenses';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Loader2, TrendingUp, PieChart as PieChartIcon, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';



interface CategoryData {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

interface CategoryBreakdownProps {
  onCategorySelect?: (category: string | null) => void;
  selectedCategory?: string | null;
}

// Enhanced color palette with better contrast and professional look
const COLORS = [
  'hsl(var(--chart-1))', // Using CSS variables for theme consistency
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
];

// Fallback colors if CSS variables aren't available
const FALLBACK_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
  '#6366f1', // indigo
];

export function CategoryBreakdown({ onCategorySelect, selectedCategory }: CategoryBreakdownProps) {
  const { user } = useAuth();
  const [showAllOpen, setShowAllOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentMaxHeight, setContentMaxHeight] = useState<number | 'none'>(0);

  // Fetch all expenses using TanStack Query
  const { data: expenses = [], isLoading: loading } = useExpenses({
    userId: user?.id,
  });

  // Calculate category data from fetched expenses
  const { categoryData, totalExpenses } = useMemo(() => {
    const categoryMap = new Map<string, number>();
    let total = 0;

    expenses.forEach((expense: any) => {
      const category = expense.category || 'Uncategorized';
      const currentTotal = categoryMap.get(category) || 0;
      categoryMap.set(category, currentTotal + expense.amount);
      total += expense.amount;
    });

    const data: CategoryData[] = Array.from(categoryMap.entries())
      .map(([name, value], index) => ({
        name,
        value: Number(value.toFixed(2)),
        percentage: total > 0 ? Number(((value / total) * 100).toFixed(1)) : 0,
        color: FALLBACK_COLORS[index % FALLBACK_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value);

    return { categoryData: data, totalExpenses: total };
  }, [expenses]);

  const handleCategoryClick = (category: string) => {
    if (onCategorySelect) {
      // Toggle: if already selected, clear filter; otherwise select it
      const newCategory = selectedCategory === category ? null : category;
      onCategorySelect(newCategory);
    }
  };

  useEffect(() => {
    // Measure content height for smooth open/close animation
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
  }, [collapsed, categoryData.length]);

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
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl">Category Breakdown</CardTitle>
          </div>
          <CardDescription>Analyzing your spending patterns...</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
          <p className="text-sm text-muted-foreground">Loading spending data...</p>
        </CardContent>
      </Card>
    );
  }

  if (categoryData.length === 0 || totalExpenses === 0) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl">Category Breakdown</CardTitle>
          </div>
          <CardDescription>View your spending by category</CardDescription>
        </CardHeader>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-center space-y-3">
            <div className="rounded-full bg-muted p-4">
              <PieChartIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">No expenses yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add some expenses to see your category breakdown
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "border-border/50 shadow-sm transition-all duration-300 ease-in-out",
      collapsed ? "gap-2 py-2" : "gap-6 py-6"
    )}>
      <CardHeader className={cn(
        "transition-all duration-300 ease-in-out",
        collapsed ? "py-1.5 px-4" : "py-2 md:py-3 px-6"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              "rounded-lg bg-primary/10 transition-all duration-300 ease-in-out",
              collapsed ? "p-1.5" : "p-2"
            )}>
              <PieChartIcon className={cn(
                "text-primary transition-all duration-300 ease-in-out",
                collapsed ? "h-4 w-4" : "h-5 w-5"
              )} />
            </div>
            <div className="overflow-hidden">
              <CardTitle className={cn(
                "transition-all duration-300 ease-in-out",
                collapsed ? "text-sm" : "text-base md:text-lg"
              )}>Category Breakdown</CardTitle>
              <div className={cn(
                "transition-all duration-300 ease-in-out",
                collapsed ? "max-h-6 opacity-100" : "max-h-6 opacity-100"
              )}>
                {!collapsed && (
                  <CardDescription className="mt-0.5 text-xs md:text-sm animate-in fade-in slide-in-from-top-1 duration-300">
                    <span className="font-semibold text-foreground">
                      ${totalExpenses.toFixed(2)}
                    </span>
                    {' '}total • {categoryData.length} categories • Tap a category to filter
                  </CardDescription>
                )}
                {collapsed && (
                  <CardDescription className="text-xs animate-in fade-in slide-in-from-top-1 duration-300">
                    <span className="font-semibold text-foreground">
                      ${totalExpenses.toFixed(2)}
                    </span>
                    {' '}total • {categoryData.length} categories
                  </CardDescription>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {selectedCategory && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onCategorySelect?.(null)}
                className={cn(
                  "transition-all duration-300 ease-in-out",
                  collapsed ? "h-7 w-7" : "h-8 w-8"
                )}
                aria-label="Clear category filter"
                title="Clear filter"
              >
                <X className={cn(
                  "transition-all duration-300 ease-in-out",
                  collapsed ? "h-3.5 w-3.5" : "h-4 w-4"
                )} />
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCollapsed((v) => !v)}
              className={cn(
                "transition-all duration-300 ease-in-out",
                collapsed ? "h-7 w-7" : "h-8 w-8",
                !collapsed && "rotate-180"
              )}
              aria-expanded={!collapsed}
              aria-label={collapsed ? 'Expand' : 'Collapse'}
            >
              <ChevronDown className={cn(
                "transition-all duration-300 ease-in-out",
                collapsed ? "h-3.5 w-3.5" : "h-4 w-4"
              )} />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {/* Mini preview when collapsed - ultra compact horizontal layout */}
      {collapsed && categoryData.length > 0 && (
        <CardContent className="py-1 px-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            {/* Mini chart */}
            <div className="relative shrink-0" style={{ width: '70px', height: '70px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={28}
                    innerRadius={18}
                    fill="#8884d8"
                    dataKey="value"
                    stroke="hsl(var(--background))"
                    strokeWidth={1}
                    onClick={(data) => handleCategoryClick(data.name)}
                    style={{ cursor: 'pointer' }}
                isAnimationActive={true}
                animationDuration={1200}
                animationBegin={0}
                animationEasing="ease-in-out"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell 
                        key={`mini-cell-${index}`} 
                        fill={entry.color}
                        opacity={selectedCategory && selectedCategory !== entry.name ? 0.3 : 1}
                        style={{ transition: 'all 0.2s ease' }}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} wrapperStyle={{ zIndex: 50 }} />
                </PieChart>
              </ResponsiveContainer>
              {/* Mini center label */}
              <div className="pointer-events-none absolute inset-0 grid place-items-center z-10">
                <p className="text-[9px] font-semibold tabular-nums">${totalExpenses.toFixed(0)}</p>
              </div>
            </div>
            
            {/* Top 3 categories - horizontal chips */}
            <div className="flex-1 flex items-center gap-2 flex-wrap min-w-0">
              {categoryData.slice(0, 3).map((category) => (
                <button
                  key={`mini-${category.name}`}
                  onClick={() => handleCategoryClick(category.name)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs transition-colors shrink-0',
                    selectedCategory === category.name
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:bg-muted/50'
                  )}
                >
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: category.color }} />
                  <span className="font-medium truncate max-w-[60px]">{category.name}</span>
                  <span className="text-[10px] font-semibold tabular-nums text-muted-foreground">{category.percentage}%</span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      )}

      {/* Collapsible content wrapper with smooth height + opacity transitions */}
      {!collapsed && (
        <CardContent
          className={cn(
            'transition-all duration-300 ease-in-out animate-in fade-in slide-in-from-top-2',
            collapsed && 'hidden'
          )}
          style={{
            opacity: collapsed ? 0 : 1,
            transform: collapsed ? 'scaleY(0.98)' : 'scaleY(1)',
          }}
        >
        <div className="md:grid md:grid-cols-[220px_1fr] md:gap-4 md:items-center space-y-4 md:space-y-0" ref={contentRef}>
        {/* Pie Chart (compact) */}
        <div className="relative w-full rounded-lg border bg-muted/10 p-3 md:p-4 overflow-visible" style={{ height: '240px', minHeight: '240px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ percentage }) => percentage > 12 ? `${percentage}%` : ''}
                outerRadius={75}
                innerRadius={50}
                fill="#8884d8"
                dataKey="value"
                onClick={(data) => handleCategoryClick(data.name)}
                style={{ cursor: 'pointer' }}
                stroke="hsl(var(--background))"
                strokeWidth={2}
                isAnimationActive={true}
                animationDuration={1200}
                animationBegin={0}
                animationEasing="ease-in-out"
              >
                {categoryData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    stroke={
                      selectedCategory === entry.name
                        ? 'hsl(var(--primary))'
                        : 'hsl(var(--background))'
                    }
                    strokeWidth={selectedCategory === entry.name ? 3 : 2}
                    opacity={
                      selectedCategory && selectedCategory !== entry.name ? 0.3 : 1
                    }
                    style={{ transition: 'all 0.2s ease' }}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomPieTooltip />} wrapperStyle={{ zIndex: 50 }} />
            </PieChart>
          </ResponsiveContainer>
          {/* Center label - positioned below tooltip layer */}
          <div className="pointer-events-none absolute inset-0 grid place-items-center z-10">
            <div className="text-center">
              <p className="text-[9px] uppercase tracking-wide text-muted-foreground opacity-80">{selectedCategory || 'Total'}</p>
              <p className="text-xs font-semibold tabular-nums">
                {selectedCategory
                  ? (() => {
                      const match = categoryData.find((d) => d.name === selectedCategory);
                      const val = match?.value ?? 0;
                      return `$${val.toFixed(2)}`;
                    })()
                  : `$${totalExpenses.toFixed(2)}`}
              </p>
            </div>
          </div>
        </div>

        {/* Category List (compact, limited) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Top categories</p>
            {categoryData.length > 6 && (
              <Dialog open={showAllOpen} onOpenChange={setShowAllOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">View all ({categoryData.length})</Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>All Categories</DialogTitle>
                    <DialogDescription>
                      Tap a category to filter your expense list
                    </DialogDescription>
                  </DialogHeader>
                  <div className="mt-2 space-y-2 max-h-[60vh] overflow-auto pr-1">
                    {categoryData.map((category, index) => {
                      const isSelected = selectedCategory === category.name;
                      return (
                        <button
                          key={`all-${category.name}`}
                          onClick={() => {
                            handleCategoryClick(category.name);
                            setShowAllOpen(false);
                          }}
                          className={cn(
                            'w-full text-left p-3 rounded-lg border transition-colors',
                            isSelected
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:bg-muted/50'
                          )}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: category.color }} />
                              <span className="font-medium truncate">{category.name}</span>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-sm font-semibold tabular-nums">${category.value.toFixed(2)}</span>
                              <span className="text-xs text-muted-foreground tabular-nums">{category.percentage}%</span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
          {(categoryData.slice(0, 6)).map((category, index) => {
            const isSelected = selectedCategory === category.name;
            const isTopCategory = index === 0;
            
            return (
              <button
                key={category.name}
                onClick={() => handleCategoryClick(category.name)}
                className={cn(
                  'group relative w-full text-left p-2.5 rounded-lg border transition-all duration-200',
                  isSelected
                    ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/30 hover:bg-muted/50',
                  isTopCategory && !isSelected && 'border-primary/20'
                )}
                style={{ minHeight: '48px' }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div
                      className={cn(
                        'w-4 h-4 rounded-full shrink-0 ring-2 ring-offset-2 ring-offset-background transition-all',
                        isSelected
                          ? 'ring-primary ring-4'
                          : 'ring-transparent group-hover:ring-primary/30'
                      )}
                      style={{ backgroundColor: category.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">
                          {category.name}
                        </span>
                        {isTopCategory && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                            <TrendingUp className="h-3 w-3" />
                            Top
                          </span>
                        )}
                      </div>
                      {/* Progress bar */}
                      <div className="mt-1.5 h-1 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${category.percentage}%`,
                            backgroundColor: category.color,
                            opacity: isSelected ? 1 : 0.7,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 shrink-0">
                    <span className="text-sm font-semibold tabular-nums">
                      ${category.value.toFixed(2)}
                    </span>
                    <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
                      {category.percentage}%
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        </div>
        </CardContent>
      )}
    </Card>
  );
}

// Custom tooltip styled with shadcn tokens - high z-index to appear above center text
function CustomPieTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0];
  const name = item?.name ?? '';
  const value = typeof item?.value === 'number' ? item.value : Number(item?.value || 0);
  const color = item?.payload?.color || 'hsl(var(--primary))';
  return (
    <div className="rounded-md border bg-popover text-popover-foreground shadow-lg px-3 py-2 text-xs relative z-[100]" style={{ pointerEvents: 'none' }}>
      <div className="flex items-center gap-2">
        <span className="inline-block size-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
        <span className="font-medium">{name}</span>
      </div>
      <div className="mt-1 font-semibold tabular-nums">${value.toFixed(2)}</div>
    </div>
  );
}

