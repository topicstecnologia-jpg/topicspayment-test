"use client";

import Link from "next/link";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, ExternalLink } from "lucide-react";
import { useForm } from "react-hook-form";

import { CinematicAuthLayout } from "@/components/auth/cinematic-auth-layout";
import { authApi, ApiError } from "@/lib/api";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/schemas/auth";

const fieldClass =
  "h-12 w-full rounded-xl border border-white/10 bg-[linear-gradient(180deg,rgba(34,35,39,0.9),rgba(21,22,26,0.92))] px-4 text-[12px] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] outline-none placeholder:text-white/34 focus:border-white/20";

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resetUrl, setResetUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: ""
    }
  });

  async function onSubmit(values: ForgotPasswordInput) {
    setError(null);
    setSuccess(null);
    setResetUrl(null);

    try {
      const response = await authApi.forgotPassword(values);
      setSuccess(response.message);
      setResetUrl(response.resetUrl ?? null);
    } catch (submitError) {
      setError(
        submitError instanceof ApiError
          ? submitError.message
          : "Nao foi possivel iniciar a recuperacao."
      );
    }
  }

  return (
    <CinematicAuthLayout
      title="Recupere o acesso a sua conta com seguranca"
      prompt="Lembrou sua senha?"
      actionLabel="Voltar ao login"
      actionHref="/login"
      collapseAside
      panelVariant="plain"
      panelContent={
        <div className="w-full max-w-[392px]">
          <div className="flex flex-col gap-5">
            <div className="space-y-3">
              <img
                src="https://res.cloudinary.com/dmwf5xxxg/image/upload/q_auto/f_auto/v1775186081/TOPICS_Pay_imxu18.png"
                alt="TOPICS Pay"
                className="h-auto w-[136px] drop-shadow-[0_12px_34px_rgba(0,0,0,0.38)]"
              />

              <h1 className="max-w-[320px] text-[1.8rem] font-semibold leading-[0.96] tracking-[-0.06em] text-white sm:text-[2.6rem]">
                Recupere o acesso a sua conta com seguranca
              </h1>

              <div className="flex items-center gap-2.5 text-[12px] text-white/44">
                <span>Lembrou sua senha?</span>
                <Link
                  href="/login"
                  className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] text-white/82 transition hover:border-white/20 hover:bg-white/[0.06]"
                >
                  Voltar ao login
                </Link>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div className="space-y-1.5">
                <input
                  type="email"
                  placeholder="Seu e-mail"
                  autoComplete="email"
                  className={fieldClass}
                  {...register("email")}
                />
                {errors.email?.message ? (
                  <p className="text-xs text-[#ff9db1]">{errors.email.message}</p>
                ) : null}
              </div>

              {error ? <p className="text-sm text-[#ff9db1]">{error}</p> : null}
              {success ? <p className="text-sm text-emerald-200">{success}</p> : null}

              {resetUrl ? (
                <a
                  href={resetUrl}
                  className="flex items-center justify-between rounded-[14px] border border-white/10 bg-white/[0.04] px-4 py-3 text-[13px] text-white/75 transition hover:border-white/20 hover:text-white"
                >
                  Abrir link de redefinicao gerado em desenvolvimento
                  <ExternalLink className="h-4 w-4" />
                </a>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="group mt-1 flex h-[50px] w-full items-center justify-center rounded-[13px] border border-white/8 bg-[linear-gradient(180deg,rgba(108,108,112,0.75),rgba(56,56,61,0.88))] px-4 text-[12px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_18px_40px_rgba(0,0,0,0.24)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="flex-1 text-center">
                  {isSubmitting ? "Enviando..." : "Enviar link de recuperacao"}
                </span>
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#121214] text-white transition group-hover:translate-x-0.5">
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </button>

              <p className="text-[11px] text-white/30">
                Se preferir, voce tambem pode{" "}
                <Link href="/signup" className="text-white/55 underline underline-offset-4">
                  criar uma nova conta
                </Link>
                .
              </p>
            </form>

            <div className="max-w-[300px] text-[10px] leading-5 text-white/22">
              Se o e-mail existir em nossa base, enviaremos um link seguro para redefinir sua senha.
            </div>
          </div>
        </div>
      }
    />
  );
}
