import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InviteFriendDialog } from './InviteFriendDialog';
import { User, UserPlus } from 'lucide-react';

interface Friend {
  id: number;
  name: string | null;
  email: string;
  status: 'pending' | 'accepted';
}

export function FriendsList() {
  const { user } = useAuth();
  
  const { data: friends, isLoading, error } = useQuery<Friend[]>({
    queryKey: ['friends', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await api.get(`/api/social/friends?userId=${user.id}`);
      return response;
    },
    enabled: !!user?.id,
  });

  if (isLoading) {
    return <div className="p-4 text-center text-muted-foreground">Loading friends...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-destructive">Failed to load friends</div>;
  }

  const acceptedFriends = friends?.filter(f => f.status === 'accepted') || [];
  const pendingFriends = friends?.filter(f => f.status === 'pending') || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">My Friends</h2>
        <InviteFriendDialog />
      </div>

      {pendingFriends.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingFriends.map((friend) => (
              <div key={friend.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={`https://avatar.vercel.sh/${friend.email}`} />
                    <AvatarFallback>{friend.name?.[0] || friend.email[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium leading-none">{friend.name || 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground">{friend.email}</p>
                  </div>
                </div>
                <Badge variant="secondary">Pending</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {acceptedFriends.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center border rounded-lg border-dashed">
            <div className="p-3 rounded-full bg-muted/50 mb-3">
              <UserPlus className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-medium">No friends yet</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
              Invite friends to share goals and track expenses together.
            </p>
          </div>
        ) : (
          acceptedFriends.map((friend) => (
            <div key={friend.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={`https://avatar.vercel.sh/${friend.email}`} />
                  <AvatarFallback>{friend.name?.[0] || friend.email[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium leading-none">{friend.name || 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground">{friend.email}</p>
                </div>
              </div>
              <Badge variant="outline" className="text-xs font-normal">
                Connected
              </Badge>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
