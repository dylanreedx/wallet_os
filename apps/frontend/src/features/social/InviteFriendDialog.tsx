import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Check, Link as LinkIcon } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export function InviteFriendDialog() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

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
      <DialogContent className="sm:max-w-md">
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
