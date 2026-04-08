"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";

import { ProfileEditorScreen } from "./profile-editor-screen";

export function ProfileMenu() {
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const { user, signOut } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!dropdownRef.current) {
        return;
      }

      if (!dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handlePointerDown);
    }

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isOpen]);

  const initials = useMemo(() => {
    if (!user?.name) {
      return "TP";
    }

    return user.name
      .split(" ")
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
  }, [user?.name]);

  if (!user) {
    return null;
  }

  async function handleLogout() {
    await signOut();
    setIsOpen(false);
    window.location.replace("/login");
  }

  return (
    <>
      <div ref={dropdownRef} className="relative">
        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          className="inline-flex h-11 items-center gap-3 rounded-full border border-white/8 bg-white/[0.04] px-3 text-sm font-medium text-white transition hover:bg-white/[0.08]"
        >
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} className="h-8 w-8 rounded-full object-cover" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.08] text-[11px] font-semibold text-white">
              {initials}
            </div>
          )}
          <span>Meu Perfil</span>
        </button>

        {isOpen ? (
          <div className="absolute right-0 top-full z-40 mt-3 w-[304px] rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(22,26,35,0.98),rgba(13,16,22,0.99))] p-4 text-white shadow-[0_28px_80px_rgba(0,0,0,0.34)]">
            <div className="flex items-center gap-3">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="h-11 w-11 rounded-full object-cover" />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.08] text-sm font-semibold text-white">
                  {initials}
                </div>
              )}

              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-white">{user.name}</p>
                <p className="truncate text-sm text-white/42">{user.email}</p>
              </div>
            </div>

            <div className="my-4 border-t border-white/8" />

            <button
              type="button"
              onClick={() => {
                setIsEditorOpen(true);
                setIsOpen(false);
              }}
              className="flex w-full items-center justify-between rounded-2xl px-1 py-2.5 text-left text-sm font-medium text-white transition hover:text-[#c4a6ff]"
            >
              <span>Editar perfil</span>
              <ChevronRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="mt-2 rounded-2xl px-1 py-2 text-left text-sm font-medium text-[#ff8aa1] transition hover:text-[#ff9fb1]"
            >
              Sair da conta
            </button>
          </div>
        ) : null}
      </div>

      <ProfileEditorScreen isOpen={isEditorOpen} onClose={() => setIsEditorOpen(false)} />
    </>
  );
}
