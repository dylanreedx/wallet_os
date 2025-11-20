import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function VerifyPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyMagicLink } = useAuth();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [error, setError] = useState('');
  const verifyCalled = useRef(false);

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setError('No verification token found.');
      return;
    }

    if (verifyCalled.current) return;
    verifyCalled.current = true;

    const verify = async () => {
      try {
        // Add a minimum delay to prevent flashing and show the skeleton
        const start = Date.now();
        await verifyMagicLink(token);
        const elapsed = Date.now() - start;
        if (elapsed < 1500) {
          await new Promise(resolve => setTimeout(resolve, 1500 - elapsed));
        }
        
        setStatus('success');
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } catch (err: any) {
        setStatus('error');
        setError(err.message || 'Failed to verify login link.');
      }
    };

    verify();
  }, [searchParams, verifyMagicLink, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border/50 shadow-lg animate-in fade-in zoom-in-95 duration-300">
        <CardHeader className="text-center pb-2">
          <CardTitle>Verifying Login</CardTitle>
          <CardDescription>Please wait while we verify your secure link.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8 space-y-6">
          {status === 'verifying' && (
            <div className="w-full space-y-4 flex flex-col items-center">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2 w-full flex flex-col items-center">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="rounded-full bg-green-500/10 p-3">
                <CheckCircle2 className="h-12 w-12 text-green-500" />
              </div>
              <div className="text-center space-y-1">
                <p className="font-medium text-lg">Successfully Logged In!</p>
                <p className="text-sm text-muted-foreground">Redirecting you to your dashboard...</p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="rounded-full bg-red-500/10 p-3">
                <XCircle className="h-12 w-12 text-red-500" />
              </div>
              <div className="text-center space-y-1">
                <p className="font-medium text-lg text-red-500">Verification Failed</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => navigate('/login')}
              >
                Back to Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
