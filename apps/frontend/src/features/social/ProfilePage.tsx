import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FriendsList } from './FriendsList';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, Pencil, Check, X, Loader2 } from 'lucide-react';
import { auth } from '@/lib/api';

export default function ProfilePage() {
  const { user, logout, setUser } = useAuth();
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingIncome, setIsEditingIncome] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editIncome, setEditIncome] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const handleSaveName = async () => {
    if (!editName.trim()) {
      setError('Name cannot be empty');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const result = await auth.updateProfile(user.id, { name: editName.trim() });
      if (result.user) {
        setUser(result.user);
        localStorage.setItem('user', JSON.stringify(result.user));
      }
      setIsEditingName(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update name');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveIncome = async () => {
    const incomeValue = parseFloat(editIncome);
    if (isNaN(incomeValue) || incomeValue < 0) {
      setError('Please enter a valid positive number');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const result = await auth.updateProfile(user.id, { monthlyIncome: incomeValue });
      if (result.user) {
        setUser(result.user);
        localStorage.setItem('user', JSON.stringify(result.user));
      }
      setIsEditingIncome(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update income');
    } finally {
      setIsSaving(false);
    }
  };

  const startEditingName = () => {
    setEditName(user?.name || '');
    setIsEditingName(true);
    setError(null);
  };

  const startEditingIncome = () => {
    setEditIncome(user.monthlyIncome?.toString() || '');
    setIsEditingIncome(true);
    setError(null);
  };

  const cancelEditing = () => {
    setIsEditingName(false);
    setIsEditingIncome(false);
    setError(null);
  };

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
        <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/50">
          <TabsTrigger value="friends">Friends</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="friends" className="space-y-4">
          <FriendsList />
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-4">
          {/* Account Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Account Information</CardTitle>
              <CardDescription>Manage your profile details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm text-muted-foreground">
                  Display Name
                </Label>
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <Input
                      id="name"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Your name"
                      className="flex-1"
                      autoFocus
                      disabled={isSaving}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleSaveName}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4 text-green-600" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={cancelEditing}
                      disabled={isSaving}
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {user.name || 'Not set'}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={startEditingName}
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </Button>
                  </div>
                )}
              </div>

              {/* Email Field (Read-only) */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Email</Label>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{user.email}</span>
                  <span className="text-xs text-muted-foreground">Read only</span>
                </div>
              </div>

              {/* Monthly Income Field */}
              <div className="space-y-2">
                <Label htmlFor="income" className="text-sm text-muted-foreground">
                  Monthly Budget
                </Label>
                {isEditingIncome ? (
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        $
                      </span>
                      <Input
                        id="income"
                        type="number"
                        step="0.01"
                        min="0"
                        value={editIncome}
                        onChange={(e) => setEditIncome(e.target.value)}
                        placeholder="0.00"
                        className="pl-7"
                        autoFocus
                        disabled={isSaving}
                      />
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleSaveIncome}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4 text-green-600" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={cancelEditing}
                      disabled={isSaving}
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {user.monthlyIncome 
                        ? `$${user.monthlyIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                        : 'Not set'}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={startEditingIncome}
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </Button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Used for budget analysis and spending insights
                </p>
              </div>

              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
              <CardDescription>Irreversible actions</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="destructive" 
                className="w-full" 
                onClick={logout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log Out
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
