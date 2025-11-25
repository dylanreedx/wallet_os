import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function InvitePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  const token = searchParams.get('token');

  useEffect(() => {
    console.log('[InvitePage] Effect running', { token, user: !!user });
    
    // If no token, redirect to login
    if (!token) {
      console.log('[InvitePage] No token, redirecting to login');
      navigate('/login');
      return;
    }

    // If not logged in, store token and show login prompt (stay on invite page)
    if (!user) {
      console.log('[InvitePage] Not logged in, storing token');
      localStorage.setItem('pendingInviteToken', token);
      setStatus('error'); // Use error state to show login prompt
      setMessage('Please log in to accept this invite');
      return;
    }

    console.log('[InvitePage] User logged in, processing invite');

    // User is logged in, process the invite
    const acceptInvite = async () => {
      try {
        // Check for token from URL or localStorage
        const inviteToken = token || localStorage.getItem('pendingInviteToken');
        
        console.log('[InvitePage] Invite token:', inviteToken);
        
        if (!inviteToken) {
          setStatus('error');
          setMessage('No invite token found');
          return;
        }

        console.log('[InvitePage] Calling accept-invite API');
        const response = await api.post('/api/social/friends/accept-invite', {
          token: inviteToken,
          userId: user.id,
        });
        
        console.log('[InvitePage] Success:', response);
        
        // Clear the pending token
        localStorage.removeItem('pendingInviteToken');
        
        // Check if user needs to set their name
        if (!user.name) {
          // Store redirect info to return after onboarding
          localStorage.setItem('postOnboardingRedirect', '/profile');
          navigate('/onboarding');
          return;
        }
        
        setStatus('success');
        setMessage(response.message || 'Invite accepted! You can now connect with your friend.');
      } catch (error: any) {
        console.error('[InvitePage] Error:', error);
        localStorage.removeItem('pendingInviteToken');
        setStatus('error');
        setMessage(error.message || 'Failed to accept invite. It may be expired or invalid.');
      }
    };

    acceptInvite();
  }, [token, user, navigate]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Processing invite...
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    const isLoginRequired = !user && token;
    
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              {isLoginRequired ? 'Login Required' : 'Invalid Invite'}
            </CardTitle>
            <CardDescription>{message}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoginRequired ? (
              <Button asChild className="w-full">
                <Link to={`/login?redirect=${encodeURIComponent(`/invite?token=${token}`)}`}>
                  Log In to Accept Invite
                </Link>
              </Button>
            ) : (
              <Button onClick={() => navigate('/')} className="w-full">
                Go to Dashboard
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="h-5 w-5" />
            Invite Accepted!
          </CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button onClick={() => navigate('/profile')} className="w-full">
            View Friends
          </Button>
          <Button onClick={() => navigate('/')} variant="outline" className="w-full">
            Go to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
