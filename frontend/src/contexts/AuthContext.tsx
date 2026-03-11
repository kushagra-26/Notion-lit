'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import type { User } from '@/types';

// ─── Types ───────────────────────────────

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
}

// ─── Context ─────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Token helpers ────────────────────────

const TOKEN_KEY = 'access_token';

function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
  // Also persist as a cookie so Next.js middleware can read it
  document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0`;
}

// ─── Provider ─────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setIsLoading(false);
      return;
    }
    authApi
      .me()
      .then((res) => setUser(res.data))
      .catch(() => clearToken())
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    const { accessToken, user: me } = res.data;
    saveToken(accessToken);
    setUser(me);
    router.replace('/');
  }, [router]);

  const register = useCallback(
    async (email: string, username: string, password: string) => {
      const res = await authApi.register(email, username, password);
      const { accessToken, user: me } = res.data;
      saveToken(accessToken);
      setUser(me);
      router.replace('/');
    },
    [router],
  );

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    router.replace('/login');
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
