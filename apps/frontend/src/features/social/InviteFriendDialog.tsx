import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Check, Link as LinkIcon } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export function InviteFriendDialog() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const dialogContentRef = useRef<HTMLDivElement>(null);
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const generateLink = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const result = await api.post('/api/social/friends/invite-link', { userId: user.id });
      if (result && result.link) {
        setInviteLink(result.link);
      }
    } catch (error) {
      console.error('Failed to generate invite link:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle visualViewport API for keyboard awareness
  useEffect(() => {
    if (!isMobile || !isOpen) return;

    const updateViewportHeight = () => {
      if (window.visualViewport) {
        setViewportHeight(window.visualViewport.height);
      } else {
        setViewportHeight(window.innerHeight);
      }
    };

    updateViewportHeight();

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateViewportHeight);
      window.visualViewport.addEventListener('scroll', updateViewportHeight);
      return () => {
        window.visualViewport?.removeEventListener('resize', updateViewportHeight);
        window.visualViewport?.removeEventListener('scroll', updateViewportHeight);
      };
    } else {
      window.addEventListener('resize', updateViewportHeight);
      return () => {
        window.removeEventListener('resize', updateViewportHeight);
      };
    }
  }, [isMobile, isOpen]);

  // Auto-scroll focused input into view
  useEffect(() => {
    if (!isMobile || !isOpen) return;

    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target && dialogContentRef.current?.contains(target)) {
        setTimeout(() => {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }, 300);
      }
    };

    document.addEventListener('focusin', handleFocus);
    return () => document.removeEventListener('focusin', handleFocus);
  }, [isMobile, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) {
        setInviteLink(null);
        setCopied(false);
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <LinkIcon className="h-4 w-4" />
          Invite Friend
        </Button>
      </DialogTrigger>
      <DialogContent
        ref={dialogContentRef}
        className={cn(
          'overflow-y-auto',
          'sm:max-w-md',
          // Mobile bottom sheet style - override default positioning
          '!bottom-0 !left-0 !right-0 !top-auto !translate-y-0 !translate-x-0',
          'sm:!bottom-auto sm:!left-[50%] sm:!right-auto sm:!top-[50%] sm:!translate-x-[-50%] sm:!translate-y-[-50%]',
          'rounded-t-2xl rounded-b-none sm:rounded-lg',
          'border-b-0 sm:border-b',
          // Mobile slide animations
          'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
          'sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:zoom-in-95',
          'p-3 sm:p-6 pb-6 sm:pb-6',
          'max-h-[90vh] sm:max-h-[85vh]',
          'transition-[max-height] duration-150 ease-out'
        )}
        style={{
          maxHeight: isMobile && viewportHeight
            ? `${viewportHeight - 20}px`
            : undefined,
          width: isMobile ? '100%' : undefined,
          maxWidth: isMobile ? '100%' : undefined,
        }}
      >
        <DialogHeader>
          <DialogTitle>Invite a Friend</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <p className="text-sm text-muted-foreground">
            Generate a unique link to invite your friends to join Wallet OS.
          </p>
          
          {!inviteLink ? (
            <Button onClick={generateLink} disabled={isLoading} className="w-full">
              {isLoading ? 'Generating...' : 'Generate Invite Link'}
            </Button>
          ) : (
            <div className="flex flex-col gap-2">
              <Label htmlFor="link" className="sr-only">
                Link
              </Label>
              <div className="flex items-center space-x-2">
                <div className="grid flex-1 gap-2">
                  <Input
                    id="link"
                    defaultValue={inviteLink}
                    readOnly
                    className="h-9"
                  />
                </div>
                <Button type="submit" size="sm" className="px-3" onClick={copyToClipboard}>
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  <span className="sr-only">Copy</span>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                This link expires in 7 days.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
