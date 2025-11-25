import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Settings, UserMinus, Loader2, Users } from 'lucide-react';
import { social } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface ManageCollaboratorsDialogProps {
  goalId: number;
  goalName: string;
  trigger?: React.ReactNode;
  onUpdate?: () => void;
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

type Role = 'viewer' | 'contributor' | 'owner';

const ROLE_BADGE_STYLES: Record<Role, string> = {
  viewer: 'bg-slate-100 text-slate-700 border-slate-200',
  contributor: 'bg-blue-100 text-blue-700 border-blue-200',
  owner: 'bg-purple-100 text-purple-700 border-purple-200',
};

export function ManageCollaboratorsDialog({
  goalId,
  goalName,
  trigger,
  onUpdate,
}: ManageCollaboratorsDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Record<number, Role>>({});

  // Fetch collaborators for this goal
  const { data: collaborators = [], isLoading } = useQuery<SharedUser[]>({
    queryKey: ['goal-users', goalId],
    queryFn: () => social.getGoalUsers(goalId),
    enabled: open && !!goalId,
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: Role }) =>
      social.updateRole(goalId, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goal-users', goalId] });
      queryClient.invalidateQueries({ queryKey: ['sharedGoals'] });
      onUpdate?.();
    },
  });

  // Remove user mutation
  const removeUserMutation = useMutation({
    mutationFn: (userId: number) => social.unshareGoal(goalId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goal-users', goalId] });
      queryClient.invalidateQueries({ queryKey: ['sharedGoals'] });
      onUpdate?.();
    },
  });

  const handleRoleChange = async (userId: number, newRole: Role) => {
    setPendingChanges((prev) => ({ ...prev, [userId]: newRole }));
    try {
      await updateRoleMutation.mutateAsync({ userId, role: newRole });
    } finally {
      setPendingChanges((prev) => {
        const copy = { ...prev };
        delete copy[userId];
        return copy;
      });
    }
  };

  const handleRemoveUser = async (userId: number) => {
    if (!confirm('Remove this collaborator from the goal?')) return;
    await removeUserMutation.mutateAsync(userId);
  };

  const isUpdating = updateRoleMutation.isPending || removeUserMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Settings className="h-4 w-4" />
            <span className="sr-only">Manage collaborators</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>Manage Collaborators</DialogTitle>
          <DialogDescription>
            Manage who has access to "{goalName}" and their permissions.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex flex-col space-y-4 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : collaborators.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="p-3 rounded-full bg-muted/50 mb-3">
                <Users className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-medium">No collaborators</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                Share this goal with friends to start collaborating.
              </p>
            </div>
          ) : (
            <div className="flex-1 min-h-0 flex flex-col space-y-4">
              <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1">
                {collaborators.map((collab) => {
                  const isPending = pendingChanges[collab.user.id] !== undefined;
                  const currentRole = pendingChanges[collab.user.id] || collab.sharedGoal.role;
                  const isCurrentUser = collab.user.id === user?.id;

                  return (
                    <div
                      key={collab.user.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarImage
                            src={`https://avatar.vercel.sh/${collab.user.email}`}
                          />
                          <AvatarFallback className="text-xs">
                            {collab.user.name?.[0] ||
                              collab.user.email[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">
                            {collab.user.name || 'Unknown'}
                            {isCurrentUser && (
                              <span className="text-muted-foreground ml-1">(you)</span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {collab.user.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Select
                          value={currentRole}
                          onValueChange={(value) =>
                            handleRoleChange(collab.user.id, value as Role)
                          }
                          disabled={isUpdating || isCurrentUser}
                        >
                          <SelectTrigger className="w-[110px] h-8 text-xs">
                            {isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <SelectValue />
                            )}
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="viewer">
                              <Badge
                                variant="outline"
                                className={`text-xs ${ROLE_BADGE_STYLES.viewer}`}
                              >
                                Viewer
                              </Badge>
                            </SelectItem>
                            <SelectItem value="contributor">
                              <Badge
                                variant="outline"
                                className={`text-xs ${ROLE_BADGE_STYLES.contributor}`}
                              >
                                Contributor
                              </Badge>
                            </SelectItem>
                            <SelectItem value="owner">
                              <Badge
                                variant="outline"
                                className={`text-xs ${ROLE_BADGE_STYLES.owner}`}
                              >
                                Owner
                              </Badge>
                            </SelectItem>
                          </SelectContent>
                        </Select>

                        {!isCurrentUser && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleRemoveUser(collab.user.id)}
                            disabled={isUpdating}
                          >
                            <UserMinus className="h-4 w-4" />
                            <span className="sr-only">Remove</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t shrink-0">
                <p className="text-xs text-muted-foreground">
                  <strong>Viewer</strong>: Can view goal progress
                  <br />
                  <strong>Contributor</strong>: Can add items and mark purchases
                  <br />
                  <strong>Owner</strong>: Full access including management
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end shrink-0 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


