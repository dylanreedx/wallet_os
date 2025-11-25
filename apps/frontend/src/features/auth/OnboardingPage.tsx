import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/lib/api';
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
import { Sparkles, ArrowRight } from 'lucide-react';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [name, setName] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If user already has a name, redirect to dashboard
  if (user?.name) {
    navigate('/', { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!user?.id) {
      setError('Session expired. Please log in again.');
      navigate('/login', { replace: true });
      return;
    }

    setLoading(true);
    try {
      const incomeValue = monthlyIncome ? parseFloat(monthlyIncome) : undefined;
      const response = await auth.updateProfile(user.id, {
        name: name.trim(),
        monthlyIncome: incomeValue,
      });

      // Update user in context and localStorage
      const updatedUser = response.user;
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));

      // Check for pending redirects (invite links, etc.)
      const postOnboardingRedirect = localStorage.getItem('postOnboardingRedirect');
      const pendingInvite = localStorage.getItem('pendingInviteToken');
      
      if (postOnboardingRedirect) {
        localStorage.removeItem('postOnboardingRedirect');
        localStorage.removeItem('pendingInviteToken');
        window.location.href = postOnboardingRedirect;
      } else if (pendingInvite) {
        localStorage.removeItem('pendingInviteToken');
        window.location.href = `/invite?token=${pendingInvite}`;
      } else {
        // Redirect to dashboard
        navigate('/', { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md animate-in fade-in zoom-in-95 duration-300 border-border/50 shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 rounded-full bg-primary/10 p-3 w-fit">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Welcome to Wallet OS!</CardTitle>
          <CardDescription className="text-base mt-2">
            Let's set up your profile to get started.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">What should we call you? *</Label>
              <Input
                id="name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="income">Monthly income (optional)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="income"
                  type="number"
                  placeholder="0"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value)}
                  min="0"
                  step="0.01"
                  className="h-11 pl-7"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                This helps with budget analysis. You can update it later.
              </p>
            </div>

            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}

            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? (
                'Saving...'
              ) : (
                <span className="flex items-center gap-2">
                  Get Started <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

