"use client";
import { Crown, LogOut, ShieldCheck, Sparkles, UserRound } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import type { AdminOverview, User } from "@/types/auth";

import { Button } from "../ui/button";

interface DashboardShellProps {
  user: User;
  adminOverview: AdminOverview | null;
}

const roleLabels = {
  admin: "Administrador",
  member: "Membro",
  guest: "Convidado"
} as const;

export function DashboardShell({ user, adminOverview }: DashboardShellProps) {
  const { signOut } = useAuth();

  async function handleLogout() {
    await signOut();
    window.location.replace("/login");
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="glass-panel flex flex-col gap-5 rounded-[34px] px-6 py-6 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs uppercase tracking-[0.34em] text-white/65">
              <Crown className="h-4 w-4 text-accent" />
              TOPICS Pay
            </div>
            <div>
              <h1 className="font-display text-5xl leading-none text-white">Painel premium protegido</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/55">
                Sessao persistida com JWT, autenticacao segura no backend e experiencia visual escura inspirada pela referencia enviada.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/70">
              Perfil: <span className="font-semibold text-white">{roleLabels[user.role]}</span>
            </div>
            <Button variant="secondary" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="glass-panel rounded-[30px] p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-white/30">Identidade</p>
              <div className="mt-6 flex items-start gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/[0.04]">
                  <UserRound className="h-7 w-7 text-accentSoft" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold text-white">{user.name}</h2>
                  <p className="text-white/55">{user.email}</p>
                  <p className="text-sm text-white/38">
                    Conta criada em {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="glass-panel rounded-[28px] p-5">
                <ShieldCheck className="h-5 w-5 text-accentSoft" />
                <h3 className="mt-4 text-lg font-semibold text-white">Protecao de rota</h3>
                <p className="mt-2 text-sm leading-6 text-white/50">
                  O acesso ao painel depende de sessao valida e cookie presente.
                </p>
              </div>
              <div className="glass-panel rounded-[28px] p-5">
                <Sparkles className="h-5 w-5 text-accentSoft" />
                <h3 className="mt-4 text-lg font-semibold text-white">Persistencia</h3>
                <p className="mt-2 text-sm leading-6 text-white/50">
                  Recarregar a pagina mantem o usuario autenticado via rota /me.
                </p>
              </div>
              <div className="glass-panel rounded-[28px] p-5">
                <Crown className="h-5 w-5 text-accentSoft" />
                <h3 className="mt-4 text-lg font-semibold text-white">Perfis ativos</h3>
                <p className="mt-2 text-sm leading-6 text-white/50">
                  Os perfis admin, member e guest ja estao modelados no Prisma.
                </p>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-[30px] p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-white/30">Resumo de acesso</p>
            <h2 className="mt-5 text-2xl font-semibold text-white">Resumo da sessao atual</h2>

            <div className="mt-6 space-y-4">
              <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
                <p className="text-sm text-white/40">Status</p>
                <p className="mt-2 text-lg font-semibold text-white">Autenticado</p>
              </div>

              <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
                <p className="text-sm text-white/40">Rota do backend</p>
                <p className="mt-2 text-lg font-semibold text-white">GET /api/me</p>
              </div>

              <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
                <p className="text-sm text-white/40">Recuperacao de senha</p>
                <p className="mt-2 text-lg font-semibold text-white">Ativada com expiracao de token</p>
              </div>
            </div>

            {user.role === "admin" ? (
              <div className="mt-6 rounded-[26px] border border-accent/20 bg-[#ff6c8f]/[0.06] p-5">
                <p className="text-sm uppercase tracking-[0.28em] text-accentSoft">
                  Visao geral do admin
                </p>
                <div className="mt-5 grid grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                    <p className="text-sm text-white/40">Total de usuarios</p>
                    <p className="mt-2 text-2xl font-semibold text-white">
                      {adminOverview?.totalUsers ?? "--"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                    <p className="text-sm text-white/40">Administradores</p>
                    <p className="mt-2 text-2xl font-semibold text-white">
                      {adminOverview?.admins ?? "--"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                    <p className="text-sm text-white/40">Membros</p>
                    <p className="mt-2 text-2xl font-semibold text-white">
                      {adminOverview?.members ?? "--"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
                    <p className="text-sm text-white/40">Convidados</p>
                    <p className="mt-2 text-2xl font-semibold text-white">
                      {adminOverview?.guests ?? "--"}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
