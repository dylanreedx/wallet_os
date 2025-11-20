import { Link, useLocation } from 'react-router-dom';
import { Home, Wallet, Target, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/expenses', label: 'Expenses', icon: Wallet },
  { path: '/goals', label: 'Goals', icon: Target },
  { path: '/budget', label: 'Budget', icon: TrendingUp },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="mx-auto flex max-w-screen-lg items-center justify-around px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || 
            (item.path === '/' && location.pathname === '/');

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1 rounded-lg px-3 py-2 transition-all duration-200',
                'hover:bg-accent active:scale-95',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              aria-label={item.label}
            >
              <Icon
                className={cn(
                  'h-5 w-5 transition-transform duration-200',
                  isActive && 'scale-110'
                )}
              />
              <span
                className={cn(
                  'text-xs font-medium transition-all duration-200',
                  isActive ? 'opacity-100' : 'opacity-70'
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}










