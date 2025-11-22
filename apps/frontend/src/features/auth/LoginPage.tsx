import { useState } from 'react';
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
import { Mail, ArrowRight } from 'lucide-react';

type Step = 'request' | 'code';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>('request');
  const { login, verifyCode } = useAuth();

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Only email is required; name can be set later in profile/settings
      await login(email);
      setStep('code');
    } catch (error) {
      console.error('Login request failed:', error);
      alert('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await verifyCode(email, code);
      // After successful login, reload so routing/auth state is consistent
      window.location.href = '/';
    } catch (error) {
      console.error('Code verification failed:', error);
      alert('Invalid or expired code. Please double-check and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'code') {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md animate-in fade-in zoom-in-95 duration-300 border-border/50 shadow-lg">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 rounded-full bg-primary/10 p-3 w-fit">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Enter your code</CardTitle>
            <CardDescription className="text-base mt-2">
              We sent a magic link and a login code to{' '}
              <span className="font-medium text-foreground">{email}</span>. You
              can either tap the link in your email or enter the code below to
              sign in.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Login code</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="ABC-123"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  className="h-11 tracking-[0.2em] uppercase"
                />
              </div>
              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? 'Verifying code...' : 'Continue'}
              </Button>
            </form>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setStep('request');
                setCode('');
              }}
            >
              Use a different email
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md animate-in fade-in zoom-in-95 duration-300 border-border/50 shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Welcome back
          </CardTitle>
          <CardDescription>
            Enter your email to get a magic link and login code
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleRequestSubmit}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="h-11"
              />
            </div>
            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? (
                'Sending email...'
              ) : (
                <span className="flex items-center gap-2">
                  Continue <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
