import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { auth } from '@/lib/api';

interface User {
  id: number;
  email: string;
  name: string | null;
}

interface AuthContextType {
  user: User | null;
  sessionId: string | null;
  loading: boolean;
  login: (email: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  verifyMagicLink: (token: string) => Promise<void>;
  verifyCode: (email: string, code: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedSessionId = localStorage.getItem('sessionId');
    const storedUser = localStorage.getItem('user');

    if (storedSessionId) {
      setSessionId(storedSessionId);

      // Restore user from localStorage if available
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          setUser(user);
        } catch (e) {
          // Invalid user data, clear it
          localStorage.removeItem('user');
        }
      }

      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, name?: string) => {
    // For magic link flow, this just triggers the email
    await auth.login(email, name);
  };

  const verifyMagicLink = async (token: string) => {
    const data = await auth.verify(token);
    setUser(data.user);
    setSessionId(data.sessionId);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('sessionId', data.sessionId);
  };

   const verifyCode = async (email: string, code: string) => {
    const data = await auth.verifyCode(email, code);
    setUser(data.user);
    setSessionId(data.sessionId);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('sessionId', data.sessionId);
  };

  const logout = async () => {
    await auth.logout();
    setUser(null);
    setSessionId(null);
    localStorage.removeItem('user');
    localStorage.removeItem('sessionId');
  };

  return (
    <AuthContext.Provider value={{ user, sessionId, loading, login, logout, verifyMagicLink, verifyCode }}>
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
