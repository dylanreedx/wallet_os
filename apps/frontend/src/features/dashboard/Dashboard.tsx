import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Link } from 'react-router-dom';

import { auth } from '@/lib/api';
import { NotificationsDropdown } from '@/components/NotificationsDropdown';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [monthlyIncome, setMonthlyIncome] = useState<number | null>(null);
  const [incomeInput, setIncomeInput] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadIncome();
    }
  }, [user?.id]);

  const loadIncome = async () => {
    if (!user?.id) return;
    try {
      const data = await auth.getIncome(user.id);
      const incomeValue = data.monthlyIncome;
      // Handle null, undefined, empty string, or invalid values
      if (incomeValue === null || incomeValue === undefined || incomeValue === '') {
        setMonthlyIncome(null);
        setIncomeInput('');
        return;
      }
      const income = Number(incomeValue);
      if (isNaN(income)) {
        setMonthlyIncome(null);
        setIncomeInput('');
        return;
      }
      setMonthlyIncome(income);
      setIncomeInput(income.toString());
    } catch (err) {
      console.error('Failed to load income:', err);
      setMonthlyIncome(null);
      setIncomeInput('');
    }
  };

  const handleSaveIncome = async () => {
    if (!user?.id) return;
    const income = parseFloat(incomeInput);
    if (isNaN(income) || income < 0) {
      return;
    }

    setSaving(true);
    try {
      await auth.updateIncome(user.id, income);
      setMonthlyIncome(income);
    } catch (err) {
      console.error('Failed to save income:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen p-4 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Wallet OS</h1>
            <p className="text-muted-foreground">
              Welcome back, {user?.name || user?.email}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <NotificationsDropdown />
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Income</CardTitle>
            <CardDescription>
              Set your monthly income for better budget analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="income" className="sr-only">
                  Monthly Income
                </Label>
                <Input
                  id="income"
                  type="number"
                  placeholder="Enter monthly income"
                  value={incomeInput}
                  onChange={(e) => setIncomeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveIncome();
                    }
                  }}
                />
              </div>
              <Button
                onClick={handleSaveIncome}
                disabled={saving}
                className="shrink-0"
              >
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
            {monthlyIncome !== null && 
             monthlyIncome !== undefined && 
             !isNaN(Number(monthlyIncome)) && (
              <p className="text-sm text-muted-foreground">
                Current: ${Number(monthlyIncome).toFixed(2)}/month
              </p>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="animate-slide-up">
            <CardHeader>
              <CardTitle>Expenses</CardTitle>
              <CardDescription>Track your spending</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link to="/expenses">View Expenses</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="animate-slide-up">
            <CardHeader>
              <CardTitle>Goals</CardTitle>
              <CardDescription>Manage your financial goals</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link to="/goals">View Goals</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="animate-slide-up">
            <CardHeader>
              <CardTitle>Budget Analysis</CardTitle>
              <CardDescription>AI-powered budget insights</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link to="/budget">Analyze Budget</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
