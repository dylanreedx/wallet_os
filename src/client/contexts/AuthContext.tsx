import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth } from '@/lib/api';

interface User {
  id: number;
  email: string;
  name: string | null;
}

interface AuthContextType {
  user: User | null;
  sessionId: string | null;
  login: (email: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedSessionId = localStorage.getItem('sessionId');
    if (storedSessionId) {
      setSessionId(storedSessionId);
      // In production, validate session with backend
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, name?: string) => {
    const data = await auth.login(email, name);
    setUser(data.user);
    setSessionId(data.sessionId);
  };

  const logout = async () => {
    await auth.logout();
    setUser(null);
    setSessionId(null);
  };

  return (
    <AuthContext.Provider value={{ user, sessionId, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
