import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { loginRequest, registerRequest, type AuthUser } from './api';
import { clearStoredSession, getStoredSession, setStoredSession } from './auth-storage';

type AuthContextValue = {
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  user: AuthUser | null;
  login: (input: { email: string; password: string }) => Promise<void>;
  register: (input: { name: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    getStoredSession()
      .then((session) => {
        if (!isMounted || !session) {
          return;
        }

        setToken(session.token);
        setUser(session.user);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (input: { email: string; password: string }) => {
    const result = await loginRequest(input);
    await setStoredSession({ token: result.token, user: result.user });
    setToken(result.token);
    setUser(result.user);
  }, []);

  const register = useCallback(async (input: { name: string; email: string; password: string }) => {
    const result = await registerRequest(input);
    await setStoredSession({ token: result.token, user: result.user });
    setToken(result.token);
    setUser(result.user);
  }, []);

  const logout = useCallback(async () => {
    await clearStoredSession();
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: Boolean(token),
      isLoading,
      token,
      user,
      login,
      register,
      logout,
    }),
    [isLoading, login, logout, register, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return value;
}
