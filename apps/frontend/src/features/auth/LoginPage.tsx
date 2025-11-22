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
import { Mail, ArrowRight, KeyRound } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [useCodeLogin, setUseCodeLogin] = useState(false);
  const [code, setCode] = useState('');
  const { login, verifyCode } = useAuth();

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, name || undefined);
      setEmailSent(true);
    } catch (error) {
      console.error('Login failed:', error);
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

  if (emailSent && !useCodeLogin) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md animate-in fade-in zoom-in-95 duration-300 border-border/50 shadow-lg">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 rounded-full bg-primary/10 p-3 w-fit">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Check your email</CardTitle>
            <CardDescription className="text-base mt-2">
              We sent a magic link and a login code to{' '}
              <span className="font-medium text-foreground">{email}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <div className="text-sm text-center text-muted-foreground space-y-2">
              <p>Click the link in the email to sign in on this device.</p>
              <p>
                If you installed the Wallet OS app on your home screen, you can
                also open the app and enter the code shown in the email.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setEmailSent(false)}
              >
                Use a different email
              </Button>
              <Button
                variant="ghost"
                className="w-full flex items-center justify-center gap-2 text-sm"
                onClick={() => setUseCodeLogin(true)}
              >
                <KeyRound className="h-4 w-4" />
                Enter code from email
              </Button>
            </div>
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
            {useCodeLogin
              ? 'Enter the email and code from your login email'
              : 'Enter your email to get a magic link and login code'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={useCodeLogin ? handleCodeSubmit : handleMagicLinkSubmit}
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
            {!useCodeLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Name (optional)</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11"
                />
              </div>
            )}
            {useCodeLogin && (
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
            )}
            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? (
                useCodeLogin ? 'Verifying code...' : 'Sending email...'
              ) : (
                <span className="flex items-center gap-2">
                  {useCodeLogin ? 'Continue with code' : 'Continue with Email'}
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>
          <div className="mt-4 text-xs text-muted-foreground text-center space-y-1">
            <button
              type="button"
              className="underline underline-offset-4"
              onClick={() => setUseCodeLogin((prev) => !prev)}
            >
              {useCodeLogin
                ? 'Use magic link instead'
                : 'Use login code instead'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
