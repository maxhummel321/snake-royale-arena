import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "@/services";
import type { User } from "@/services";

interface AuthCtx {
  user: User | null;
  login: (u: string, p: string) => Promise<void>;
  signup: (u: string, p: string) => Promise<void>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(api.currentUser());
  }, []);

  const login = useCallback(async (u: string, p: string) => {
    const r = await api.login(u, p);
    setUser(r.user);
  }, []);
  const signup = useCallback(async (u: string, p: string) => {
    const r = await api.signup(u, p);
    setUser(r.user);
  }, []);
  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
  }, []);

  return <Ctx.Provider value={{ user, login, signup, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
