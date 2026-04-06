"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, RefreshCcw } from "lucide-react";
import { useForm } from "react-hook-form";

import { CinematicAuthLayout } from "@/components/auth/cinematic-auth-layout";
import { useAuth } from "@/hooks/use-auth";
import { authApi, ApiError } from "@/lib/api";
import {
  resendVerificationCodeSchema,
  verifyAccountCodeSchema,
  type ResendVerificationCodeInput,
  type VerifyAccountCodeInput
} from "@/schemas/auth";

const fieldClass =
  "h-[52px] w-full rounded-[13px] border border-white/10 bg-[linear-gradient(180deg,rgba(34,35,39,0.9),rgba(21,22,26,0.92))] px-4 text-[13px] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] outline-none placeholder:text-white/34 focus:border-white/20";

function VerifyAccountContent() {
  const searchParams = useSearchParams();
  const { refreshSession, setUser } = useAuth();

  const initialEmail = searchParams.get("email") ?? "";
  const initialCode = searchParams.get("code") ?? "";

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resentMessage, setResentMessage] = useState<string | null>(null);

  const verifyForm = useForm<VerifyAccountCodeInput>({
    resolver: zodResolver(verifyAccountCodeSchema),
    defaultValues: {
      email: initialEmail,
      code: initialCode
    }
  });

  const resendForm = useForm<ResendVerificationCodeInput>({
    resolver: zodResolver(resendVerificationCodeSchema),
    defaultValues: {
      email: initialEmail
    }
  });

  async function handleVerify(values: VerifyAccountCodeInput) {
    setError(null);
    setSuccess(null);

    try {
      const response = await authApi.verifyAccountCode(values);
      setUser(response.user);
      const sessionUser = await refreshSession();

      if (!sessionUser) {
        throw new ApiError("Nao foi possivel validar a sessao apos confirmar a conta.", 401);
      }

      setSuccess("Conta confirmada com sucesso. Redirecionando...");
      setTimeout(() => {
        window.location.replace("/dashboard");
      }, 900);
    } catch (submitError) {
      setError(submitError instanceof ApiError ? submitError.message : "Falha ao confirmar conta.");
    }
  }

  async function handleResend(values: ResendVerificationCodeInput) {
    setError(null);
    setResentMessage(null);

    try {
      const response = await authApi.resendVerificationCode(values);
      const devCode = response.verificationCode
        ? ` Codigo em desenvolvimento: ${response.verificationCode}.`
        : "";
      setResentMessage(`${response.message}${devCode}`);
    } catch (submitError) {
      setError(submitError instanceof ApiError ? submitError.message : "Falha ao reenviar codigo.");
    }
  }

  return (
    <CinematicAuthLayout
      title="Confirme sua conta com o codigo de verificacao"
      prompt="Ja tem o codigo em maos?"
      actionLabel="Voltar ao login"
      actionHref="/login"
      footer={
        <span>
          Para concluir seu cadastro, informe o codigo de 6 digitos enviado para o e-mail da conta.
        </span>
      }
    >
      <form onSubmit={verifyForm.handleSubmit(handleVerify)} className="space-y-3">
        <div className="space-y-1.5">
          <input
            type="email"
            placeholder="Seu e-mail"
            autoComplete="email"
            className={fieldClass}
            {...verifyForm.register("email")}
          />
          {verifyForm.formState.errors.email?.message ? (
            <p className="text-xs text-[#ff9db1]">{verifyForm.formState.errors.email.message}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <input
            type="text"
            inputMode="numeric"
            placeholder="Codigo de 6 digitos"
            className={fieldClass}
            {...verifyForm.register("code")}
          />
          {verifyForm.formState.errors.code?.message ? (
            <p className="text-xs text-[#ff9db1]">{verifyForm.formState.errors.code.message}</p>
          ) : null}
        </div>

        {error ? <p className="text-sm text-[#ff9db1]">{error}</p> : null}
        {success ? <p className="text-sm text-emerald-200">{success}</p> : null}
        {resentMessage ? <p className="text-sm text-white/60">{resentMessage}</p> : null}

        <button
          type="submit"
          disabled={verifyForm.formState.isSubmitting}
          className="group mt-2 flex h-[54px] w-full items-center justify-center rounded-[14px] border border-white/8 bg-[linear-gradient(180deg,rgba(108,108,112,0.75),rgba(56,56,61,0.88))] px-5 text-[13px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_18px_40px_rgba(0,0,0,0.24)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="flex-1 text-center">
            {verifyForm.formState.isSubmitting ? "Confirmando..." : "Confirmar conta"}
          </span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#121214] text-white transition group-hover:translate-x-0.5">
            <ArrowRight className="h-4 w-4" />
          </span>
        </button>
      </form>

      <form
        onSubmit={resendForm.handleSubmit(handleResend)}
        className="mt-4 flex items-center gap-3 rounded-[14px] border border-white/8 bg-white/[0.03] px-4 py-3"
      >
        <input type="hidden" {...resendForm.register("email")} />
        <p className="flex-1 text-[11px] leading-5 text-white/34">
          Nao recebeu o codigo? Reenvie para o e-mail informado.
        </p>
        <button
          type="submit"
          disabled={resendForm.formState.isSubmitting}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-[11px] text-white/70 transition hover:border-white/20 hover:text-white disabled:opacity-60"
        >
          <RefreshCcw className="h-3.5 w-3.5" />
          {resendForm.formState.isSubmitting ? "Reenviando" : "Reenviar"}
        </button>
      </form>
    </CinematicAuthLayout>
  );
}

export default function VerifyAccountPage() {
  return (
    <Suspense fallback={null}>
      <VerifyAccountContent />
    </Suspense>
  );
}
