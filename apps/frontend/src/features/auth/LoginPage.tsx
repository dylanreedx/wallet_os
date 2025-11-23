import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>('request');
  const { login, verifyCode } = useAuth();

  const redirectUrl = searchParams.get('redirect');
  const pendingInviteToken = localStorage.getItem('pendingInviteToken');
  const isInvite = redirectUrl?.includes('/invite') || !!pendingInviteToken;

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
      
      // Check if there's a pending invite or redirect to invite
      const pendingInvite = localStorage.getItem('pendingInviteToken');
      const isInviteRedirect = redirectUrl?.includes('/invite');
      
      console.log('[LoginPage] After login, pending invite:', pendingInvite, 'redirectUrl:', redirectUrl);
      
      if (isInviteRedirect && redirectUrl) {
        // Redirect URL already has the token, use it directly
        console.log('[LoginPage] Redirecting to invite page via redirectUrl');
        window.location.href = redirectUrl;
        localStorage.removeItem('pendingInviteToken'); // Clean up
      } else if (pendingInvite) {
        // Use pending invite token from localStorage
        console.log('[LoginPage] Redirecting to invite page with pending token');
        window.location.href = `/invite?token=${pendingInvite}`;
        localStorage.removeItem('pendingInviteToken');
      } else if (redirectUrl) {
        // Use the redirect URL if provided
        navigate(redirectUrl);
      } else {
        // Default to home
        window.location.href = '/';
      }
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
            {isInvite ? 'Join your friend' : 'Welcome back'}
          </CardTitle>
          <CardDescription>
            {isInvite 
              ? 'Enter your email to accept the invite and get started'
              : 'Enter your email to get a magic link and login code'
            }
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
