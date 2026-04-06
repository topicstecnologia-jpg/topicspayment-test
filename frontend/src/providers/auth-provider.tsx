"use client";

import { createContext, useEffect, useState } from "react";

import { ApiError, authApi } from "@/lib/api";
import type { LoginInput } from "@/schemas/auth";
import type { User } from "@/types/auth";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  signIn: (values: LoginInput) => Promise<User>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<User | null>;
  setUser: (user: User | null) => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  async function refreshSession() {
    try {
      const response = await authApi.me();
      setUser(response.user);
      return response.user;
    } catch {
      setUser(null);
      return null;
    }
  }

  async function signIn(values: LoginInput) {
    const response = await authApi.login(values);
    setUser(response.user);

    const sessionUser = await refreshSession();

    if (!sessionUser) {
      throw new ApiError("Nao foi possivel validar a sessao apos o login. Tente novamente.", 401);
    }

    return sessionUser;
  }

  async function signOut() {
    await authApi.logout();
    setUser(null);
  }

  useEffect(() => {
    let active = true;

    void authApi
      .me()
      .then((response) => {
        if (active) {
          setUser(response.user);
        }
      })
      .catch(() => {
        if (active) {
          setUser(null);
        }
      })
      .finally(() => {
        if (active) {
          setIsBootstrapping(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isBootstrapping,
        signIn,
        signOut,
        refreshSession,
        setUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
