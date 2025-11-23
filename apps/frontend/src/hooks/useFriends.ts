import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { social } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export function useFriends() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const friendsQuery = useQuery({
    queryKey: ['friends', user?.id],
    queryFn: () => (user ? social.getFriends(user.id) : Promise.resolve([])),
    enabled: !!user,
  });

  const inviteFriendMutation = useMutation({
    mutationFn: (email: string) => social.inviteFriend(email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends', user?.id] });
    },
  });

  const acceptFriendMutation = useMutation({
    mutationFn: (friendId: number) => social.acceptFriend(friendId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends', user?.id] });
    },
  });

  return {
    friends: friendsQuery.data || [],
    isLoading: friendsQuery.isLoading,
    error: friendsQuery.error,
    inviteFriend: inviteFriendMutation.mutate,
    acceptFriend: acceptFriendMutation.mutate,
  };
}
