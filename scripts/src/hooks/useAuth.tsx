import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import api, { clearToken, getToken, getUser, setToken, ApiError } from "@/lib/api";
import { auth as authApi } from "@/lib/api/auth";
import type { User } from "@/lib/api";

type LoginResult =
  | { user: User; token: string; requiresOtp?: false }
  | { user: null; token: null; requiresOtp: true; email?: string; message?: string };

type SignupResult =
  | { user: User; token: string; requiresOtp?: false }
  | { user: null; token: null; requiresOtp: true; email?: string; message?: string };

type AuthCtx = {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (creds: { phone?: string; email?: string; password: string }) => Promise<LoginResult>;
  signup: (body: { name: string; email: string; phone: string; password: string; city?: string; language?: string }) => Promise<SignupResult>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    const useStoredUser = () => {
      const stored = getUser();
      if (stored) setUser(stored);
    };
    const tryMe = async () => {
      const { user } = await api.auth.me();
      setUser(user);
    };
    try {
      await tryMe();
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        // Try one refresh round-trip before giving up.
        try {
          const r = await authApi.refresh();
          if (r.data?.token) setToken(r.data.token);
          await tryMe();
        } catch (e2) {
          if (e2 instanceof ApiError && e2.status === 401) {
            clearToken();
            setUser(null);
          } else {
            // eslint-disable-next-line no-console
            console.warn("auth refresh failed (non-401), keeping current session", e2);
          }
        }
      } else if (e instanceof ApiError && e.status === 404) {
        // Some deployed backend versions do not expose /auth/me yet; keep the locally stored login user.
        useStoredUser();
      } else {
        // eslint-disable-next-line no-console
        console.warn("auth.me failed (non-401), keeping current session", e);
        useStoredUser();
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const onAuth = () => refresh();
    window.addEventListener("saba:auth", onAuth);
    window.addEventListener("storage", onAuth);
    return () => {
      window.removeEventListener("saba:auth", onAuth);
      window.removeEventListener("storage", onAuth);
    };
  }, [refresh]);

  const login = useCallback(async (creds: { phone?: string; email?: string; password: string }): Promise<LoginResult> => {
    const data = await api.auth.login(creds);
    if (data?.requiresOtp) {
      return { user: null, token: null, requiresOtp: true, email: data.email, message: data.message };
    }
    if (!data?.token || !data?.user) {
      throw new ApiError(500, "Invalid auth response");
    }
    setToken(data.token);
    setUser(data.user);
    return { user: data.user, token: data.token };
  }, []);

  const signup = useCallback(async (body: { name: string; email: string; phone: string; password: string; city?: string; language?: string }): Promise<SignupResult> => {
    const data = await api.auth.signup(body);
    if ((data as any)?.requiresOtp) {
      return { user: null, token: null, requiresOtp: true, email: (data as any).email, message: (data as any).message };
    }
    if (!data?.token || !data?.user) throw new ApiError(500, "Invalid auth response");
    setToken(data.token);
    setUser(data.user);
    return { user: data.user, token: data.token };
  }, []);

  const logout = useCallback(async () => {
    try { await api.auth.logout(); } catch { /* ignore */ }
    clearToken();
    setUser(null);
  }, []);

  const value: AuthCtx = {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: !!user && user.role === "admin",
    login, signup, logout, refresh,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}