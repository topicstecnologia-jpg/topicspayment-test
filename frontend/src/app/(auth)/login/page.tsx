"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";

import { CinematicAuthLayout } from "@/components/auth/cinematic-auth-layout";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api";
import { loginSchema, type LoginInput } from "@/schemas/auth";

const fieldClass =
  "h-12 w-full rounded-xl border border-white/10 bg-[linear-gradient(180deg,rgba(34,35,39,0.9),rgba(21,22,26,0.92))] px-4 text-[12px] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] outline-none placeholder:text-white/34 focus:border-white/20";

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  async function onSubmit(values: LoginInput) {
    setError(null);

    try {
      await signIn(values);
      window.location.replace("/dashboard");
    } catch (submitError) {
      if (submitError instanceof ApiError) {
        const details =
          typeof submitError.details === "object" && submitError.details !== null
            ? (submitError.details as { reason?: string; email?: string })
            : undefined;

        if (details?.reason === "ACCOUNT_NOT_VERIFIED" && details.email) {
          router.push(`/verify-account?email=${encodeURIComponent(details.email)}`);
          return;
        }

        setError(submitError.message);
        return;
      }

      setError("Falha ao entrar.");
    }
  }

  return (
    <CinematicAuthLayout
      title="Entre na sua conta para continuar sua jornada"
      prompt="Ainda nao tem uma conta?"
      actionLabel="Criar conta"
      actionHref="/signup"
      showBackButton={false}
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

              <h1 className="max-w-[296px] text-[1.8rem] font-semibold leading-[0.96] tracking-[-0.06em] text-white sm:text-[2.6rem]">
                Entre na sua conta para continuar sua jornada
              </h1>

              <div className="flex items-center gap-2.5 text-[12px] text-white/44">
                <span>Ainda nao tem uma conta?</span>
                <Link
                  href="/signup"
                  className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] text-white/82 transition hover:border-white/20 hover:bg-white/[0.06]"
                >
                  Criar conta
                </Link>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div className="space-y-1.5">
                <input
                  type="email"
                  placeholder="Seu e-mail"
                  autoComplete="email"
                  className={`${fieldClass} border-emerald-200/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_0_1px_rgba(193,255,204,0.03)] focus:border-emerald-300/40`}
                  {...register("email")}
                />
                {errors.email?.message ? <p className="text-xs text-[#ff9db1]">{errors.email.message}</p> : null}
              </div>

              <div className="space-y-1.5">
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Senha"
                    autoComplete="current-password"
                    className={`${fieldClass} pr-14 placeholder:text-white/42`}
                    {...register("password")}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-white/34 transition hover:text-white/62"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  {errors.password?.message ? (
                    <p className="text-xs text-[#ff9db1]">{errors.password.message}</p>
                  ) : (
                    <span />
                  )}

                  <Link href="/forgot-password" className="text-[10px] text-white/26 transition hover:text-white/48">
                    Esqueceu a senha?
                  </Link>
                </div>
              </div>

              {error ? <p className="text-sm text-[#ff9db1]">{error}</p> : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="group mt-1 flex h-[50px] w-full items-center justify-center rounded-[13px] border border-white/8 bg-[linear-gradient(180deg,rgba(108,108,112,0.75),rgba(56,56,61,0.88))] px-4 text-[12px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_18px_40px_rgba(0,0,0,0.24)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="flex-1 text-center">{isSubmitting ? "Entrando..." : "Entrar agora"}</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#121214] text-white transition group-hover:translate-x-0.5">
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </button>
            </form>

            <div className="max-w-[300px] text-[10px] leading-5 text-white/22">
              Ao entrar, voce concorda com os Termos de Uso, Politica de Privacidade e diretrizes de
              seguranca da plataforma TOPICS Pay.
            </div>
          </div>
        </div>
      }
    />
  );
}
