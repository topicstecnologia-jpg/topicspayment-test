"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

export type PlatformToastTone = "success" | "error" | "info";

export interface PlatformToast {
  id: string;
  title: string;
  description?: string;
  tone: PlatformToastTone;
  durationMs: number;
}

interface PlatformToastInput {
  title: string;
  description?: string;
  tone?: PlatformToastTone;
  durationMs?: number;
}

interface PlatformShellContextValue {
  isHeroVisible: boolean;
  setHeroVisible: (visible: boolean) => void;
  toasts: PlatformToast[];
  notify: (toast: PlatformToastInput) => string;
  dismissToast: (id: string) => void;
}

const PlatformShellContext = createContext<PlatformShellContextValue | null>(null);

export function PlatformShellProvider({ children }: { children: React.ReactNode }) {
  const [isHeroVisible, setHeroVisible] = useState(true);
  const [toasts, setToasts] = useState<PlatformToast[]>([]);
  const timeoutRefs = useRef<Map<string, number>>(new Map());

  function dismissToast(id: string) {
    const timeoutId = timeoutRefs.current.get(id);

    if (timeoutId) {
      window.clearTimeout(timeoutId);
      timeoutRefs.current.delete(id);
    }

    setToasts((current) => current.filter((toast) => toast.id !== id));
  }

  function notify(toast: PlatformToastInput) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const nextToast: PlatformToast = {
      id,
      title: toast.title,
      description: toast.description,
      tone: toast.tone ?? "info",
      durationMs: toast.durationMs ?? 4200
    };

    setToasts((current) => [...current.slice(-3), nextToast]);

    const timeoutId = window.setTimeout(() => {
      dismissToast(id);
    }, nextToast.durationMs);

    timeoutRefs.current.set(id, timeoutId);

    return id;
  }

  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      timeoutRefs.current.clear();
    };
  }, []);

  const value = useMemo(
    () => ({
      isHeroVisible,
      setHeroVisible,
      toasts,
      notify,
      dismissToast
    }),
    [dismissToast, isHeroVisible, notify, toasts]
  );

  return <PlatformShellContext.Provider value={value}>{children}</PlatformShellContext.Provider>;
}

export function usePlatformShell() {
  const context = useContext(PlatformShellContext);

  if (!context) {
    throw new Error("usePlatformShell must be used within a PlatformShellProvider.");
  }

  return context;
}
