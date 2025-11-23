import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FriendsList } from './FriendsList';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export default function ProfilePage() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="container max-w-md mx-auto pb-24 pt-6 px-4">
      <div className="flex flex-col items-center mb-8">
        <Avatar className="h-24 w-24 mb-4">
          <AvatarImage src={`https://avatar.vercel.sh/${user.email}`} />
          <AvatarFallback className="text-2xl">
            {user.name?.[0] || user.email[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <h1 className="text-2xl font-bold">{user.name || 'User'}</h1>
        <p className="text-muted-foreground">{user.email}</p>
      </div>

      <Tabs defaultValue="friends" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="friends">Friends</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="friends" className="space-y-4">
          <FriendsList />
        </TabsContent>
        
        <TabsContent value="settings">
          <div className="space-y-4">
            <div className="rounded-lg border p-4 space-y-4">
              <h3 className="font-medium">Account</h3>
              <Button 
                variant="destructive" 
                className="w-full justify-start" 
                onClick={logout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log Out
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
