import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Share2, UserPlus, Loader2 } from 'lucide-react';
import { social } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useFriends } from '@/hooks/useFriends';
import { cn } from '@/lib/utils';

interface ShareGoalDialogProps {
  goalId: number;
  goalName: string;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

interface SharedUser {
  sharedGoal: {
    id: number;
    userId: number;
    role: 'viewer' | 'contributor' | 'owner';
  };
  user: {
    id: number;
    name: string | null;
    email: string;
  };
}

export function ShareGoalDialog({
  goalId,
  goalName,
  trigger,
  onSuccess,
}: ShareGoalDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { friends, isLoading: loadingFriends } = useFriends();
  const [open, setOpen] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<number[]>([]);
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogContentRef = useRef<HTMLDivElement>(null);
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Fetch already shared users for this goal
  const { data: sharedUsers = [], isLoading: loadingShared } = useQuery<
    SharedUser[]
  >({
    queryKey: ['goal-users', goalId],
    queryFn: () => social.getGoalUsers(goalId),
    enabled: open && !!goalId,
  });

  const alreadySharedIds = sharedUsers.map((su) => su.user.id);

  // Filter to only accepted friends who aren't already shared with
  const availableFriends = (friends || []).filter(
    (f: any) => f.status === 'accepted' && !alreadySharedIds.includes(f.id)
  );

  const handleToggleFriend = (friendId: number) => {
    setSelectedFriends((prev) =>
      prev.includes(friendId)
        ? prev.filter((id) => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleShare = async () => {
    if (selectedFriends.length === 0) return;

    setIsSharing(true);
    setError(null);

    try {
      for (const friendId of selectedFriends) {
        await social.shareGoal(goalId, friendId, 'contributor');
      }
      
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['goal-users', goalId] });
      queryClient.invalidateQueries({ queryKey: ['sharedGoals'] });
      
      setSelectedFriends([]);
      setOpen(false);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to share goal');
    } finally {
      setIsSharing(false);
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
    if (!isMobile || !open) return;

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
  }, [isMobile, open]);

  // Auto-scroll focused input into view
  useEffect(() => {
    if (!isMobile || !open) return;

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
  }, [isMobile, open]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedFriends([]);
      setError(null);
    }
  }, [open]);

  const isLoading = loadingFriends || loadingShared;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Share2 className="h-4 w-4" />
            <span className="sr-only">Share goal</span>
          </Button>
        )}
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
          <DialogTitle>Share Goal</DialogTitle>
          <DialogDescription>
            Share "{goalName}" with your friends so they can collaborate.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Already shared with */}
              {sharedUsers.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Already shared with
                  </p>
                  <div className="space-y-2">
                    {sharedUsers.map((su) => (
                      <div
                        key={su.user.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={`https://avatar.vercel.sh/${su.user.email}`}
                            />
                            <AvatarFallback className="text-xs">
                              {su.user.name?.[0] ||
                                su.user.email[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">
                            {su.user.name || su.user.email}
                          </span>
                        </div>
                        <Badge variant="secondary" className="text-xs capitalize">
                          {su.sharedGoal.role}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Available friends to share with */}
              {availableFriends.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Share with friends</p>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {availableFriends.map((friend: any) => (
                      <label
                        key={friend.id}
                        className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <Checkbox
                          checked={selectedFriends.includes(friend.id)}
                          onCheckedChange={() => handleToggleFriend(friend.id)}
                        />
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={`https://avatar.vercel.sh/${friend.email}`}
                          />
                          <AvatarFallback className="text-xs">
                            {friend.name?.[0] || friend.email[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {friend.name || 'Unknown'}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {friend.email}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ) : friends?.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="p-3 rounded-full bg-muted/50 mb-3">
                    <UserPlus className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-sm font-medium">No friends yet</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                    Add friends from your profile to share goals with them.
                  </p>
                </div>
              ) : (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  All your friends already have access to this goal.
                </div>
              )}

              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleShare}
            disabled={selectedFriends.length === 0 || isSharing}
          >
            {isSharing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sharing...
              </>
            ) : (
              <>
                <Share2 className="mr-2 h-4 w-4" />
                Share ({selectedFriends.length})
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


