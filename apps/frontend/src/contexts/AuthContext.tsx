import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { auth, AuthError, setAuthErrorCallback } from '@/lib/api';

interface User {
  id: number;
  email: string;
  name: string | null;
  monthlyIncome?: number | null;
}

interface AuthContextType {
  user: User | null;
  sessionId: string | null;
  loading: boolean;
  login: (email: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  verifyMagicLink: (token: string) => Promise<User>;
  verifyCode: (email: string, code: string) => Promise<User>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Handle auth errors from API layer - clear session properly
  const handleAuthError = useCallback(() => {
    console.log('[Auth] Auth error detected, clearing session');
    setUser(null);
    setSessionId(null);
    localStorage.removeItem('user');
    localStorage.removeItem('sessionId');
  }, []);

  // Register auth error callback on mount
  useEffect(() => {
    setAuthErrorCallback(handleAuthError);
    return () => setAuthErrorCallback(null);
  }, [handleAuthError]);

  useEffect(() => {
    const storedSessionId = localStorage.getItem('sessionId');
    const storedUser = localStorage.getItem('user');

    if (storedSessionId) {
      // Set initial state from localStorage while validating
      setSessionId(storedSessionId);
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        } catch (e) {
          localStorage.removeItem('user');
        }
      }

      // Validate session with backend (non-blocking)
      // Only clear session on explicit auth errors, not network errors
      auth.validateSession()
        .then((data) => {
          if (data.valid && data.user) {
            // Session is valid, update user data in case it changed
            setUser(data.user);
            localStorage.setItem('user', JSON.stringify(data.user));
          }
        })
        .catch((error) => {
          // Only clear session on actual auth errors (401), not network errors
          if (error instanceof AuthError) {
            console.log('[Auth] Session validation failed (auth error), logging out');
            setUser(null);
            setSessionId(null);
            localStorage.removeItem('user');
            localStorage.removeItem('sessionId');
          } else {
            // Network error or other issue - keep the session, user can retry
            console.log('[Auth] Session validation failed (network error), keeping session');
          }
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, name?: string) => {
    // For magic link flow, this just triggers the email
    await auth.login(email, name);
  };

  const verifyMagicLink = async (token: string): Promise<User> => {
    const data = await auth.verify(token);
    setUser(data.user);
    setSessionId(data.sessionId);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('sessionId', data.sessionId);
    return data.user;
  };

  const verifyCode = async (email: string, code: string): Promise<User> => {
    const data = await auth.verifyCode(email, code);
    setUser(data.user);
    setSessionId(data.sessionId);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('sessionId', data.sessionId);
    return data.user;
  };

  const logout = async () => {
    await auth.logout();
    setUser(null);
    setSessionId(null);
    localStorage.removeItem('user');
    localStorage.removeItem('sessionId');
  };

  return (
    <AuthContext.Provider value={{ user, sessionId, loading, login, logout, verifyMagicLink, verifyCode, setUser }}>
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
