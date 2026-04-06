"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import { useForm } from "react-hook-form";

import { CinematicAuthLayout } from "@/components/auth/cinematic-auth-layout";
import { useAuth } from "@/hooks/use-auth";
import { authApi, ApiError } from "@/lib/api";
import { resetPasswordSchema, type ResetPasswordInput } from "@/schemas/auth";

const fieldClass =
  "h-[52px] w-full rounded-[13px] border border-white/10 bg-[linear-gradient(180deg,rgba(34,35,39,0.9),rgba(21,22,26,0.92))] px-4 text-[13px] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] outline-none placeholder:text-white/34 focus:border-white/20";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const { refreshSession } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const token = searchParams.get("token") ?? "";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token,
      password: "",
      confirmPassword: ""
    }
  });

  async function onSubmit(values: ResetPasswordInput) {
    setError(null);
    setSuccess(null);

    try {
      await authApi.resetPassword(values);
      const sessionUser = await refreshSession();

      if (!sessionUser) {
        throw new ApiError("Nao foi possivel validar a sessao apos redefinir a senha.", 401);
      }

      setSuccess("Senha atualizada com sucesso. Redirecionando para o painel...");
      setTimeout(() => {
        window.location.replace("/dashboard");
      }, 900);
    } catch (submitError) {
      setError(
        submitError instanceof ApiError
          ? submitError.message
          : "Nao foi possivel redefinir a senha."
      );
    }
  }

  return (
    <CinematicAuthLayout
      title="Defina uma nova senha para voltar a sua conta"
      prompt="Precisa de outro token?"
      actionLabel="Solicitar novamente"
      actionHref="/forgot-password"
      footer={
        <span>
          A nova senha sera aplicada imediatamente e sua sessao podera ser restaurada em seguida.
        </span>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="space-y-1.5">
          <input
            type="text"
            placeholder="Token de recuperacao"
            className={fieldClass}
            {...register("token")}
          />
          {errors.token?.message ? <p className="text-xs text-[#ff9db1]">{errors.token.message}</p> : null}
        </div>

        <div className="space-y-1.5">
          <input
            type="password"
            placeholder="Nova senha"
            autoComplete="new-password"
            className={fieldClass}
            {...register("password")}
          />
          {errors.password?.message ? (
            <p className="text-xs text-[#ff9db1]">{errors.password.message}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <input
            type="password"
            placeholder="Confirmar senha"
            autoComplete="new-password"
            className={fieldClass}
            {...register("confirmPassword")}
          />
          {errors.confirmPassword?.message ? (
            <p className="text-xs text-[#ff9db1]">{errors.confirmPassword.message}</p>
          ) : null}
        </div>

        {error ? <p className="text-sm text-[#ff9db1]">{error}</p> : null}
        {success ? <p className="text-sm text-emerald-200">{success}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="group mt-2 flex h-[54px] w-full items-center justify-center rounded-[14px] border border-white/8 bg-[linear-gradient(180deg,rgba(108,108,112,0.75),rgba(56,56,61,0.88))] px-5 text-[13px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_18px_40px_rgba(0,0,0,0.24)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="flex-1 text-center">
            {isSubmitting ? "Redefinindo..." : "Salvar nova senha"}
          </span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#121214] text-white transition group-hover:translate-x-0.5">
            <ArrowRight className="h-4 w-4" />
          </span>
        </button>

        <p className="text-[11px] text-white/30">
          Quer voltar?{" "}
          <Link href="/login" className="text-white/55 underline underline-offset-4">
            Ir para o login
          </Link>
        </p>
      </form>
    </CinematicAuthLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}
