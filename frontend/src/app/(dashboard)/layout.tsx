"use client";

import { PlatformLayout } from "@/components/platform/platform-layout";
import { PlatformShellProvider } from "@/components/platform/platform-shell-context";

export default function DashboardGroupLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <PlatformShellProvider>
      <PlatformLayout>{children}</PlatformLayout>
    </PlatformShellProvider>
  );
}
