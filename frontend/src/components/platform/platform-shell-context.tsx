"use client";

import { createContext, useContext, useMemo, useState } from "react";

interface PlatformShellContextValue {
  isHeroVisible: boolean;
  setHeroVisible: (visible: boolean) => void;
}

const PlatformShellContext = createContext<PlatformShellContextValue | null>(null);

export function PlatformShellProvider({ children }: { children: React.ReactNode }) {
  const [isHeroVisible, setHeroVisible] = useState(true);

  const value = useMemo(
    () => ({
      isHeroVisible,
      setHeroVisible
    }),
    [isHeroVisible]
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
