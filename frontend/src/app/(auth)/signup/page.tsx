"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import { useForm } from "react-hook-form";

import { CinematicAuthLayout } from "@/components/auth/cinematic-auth-layout";
import { authApi, ApiError } from "@/lib/api";
import { registerSchema, type RegisterInput } from "@/schemas/auth";

const fieldClass =
  "h-12 w-full rounded-xl border border-white/10 bg-[linear-gradient(180deg,rgba(34,35,39,0.9),rgba(21,22,26,0.92))] px-4 text-[12px] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] outline-none placeholder:text-white/34 focus:border-white/20";

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "member",
      password: "",
      confirmPassword: ""
    }
  });

  async function onSubmit(values: RegisterInput) {
    setError(null);

    try {
      const response = await authApi.register(values);
      const query = new URLSearchParams({
        email: response.email
      });

      if (response.verificationCode) {
        query.set("code", response.verificationCode);
      }

      router.push(`/verify-account?${query.toString()}`);
    } catch (submitError) {
      setError(submitError instanceof ApiError ? submitError.message : "Falha ao criar conta.");
    }
  }

  return (
    <CinematicAuthLayout
      title="Crie sua conta para acessar a experiencia TOPICS Pay"
      prompt="Ja possui uma conta?"
      actionLabel="Entrar"
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
                Crie sua conta para acessar a experiencia TOPICS Pay
              </h1>

              <div className="flex items-center gap-2.5 text-[12px] text-white/44">
                <span>Ja possui uma conta?</span>
                <Link
                  href="/login"
                  className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] text-white/82 transition hover:border-white/20 hover:bg-white/[0.06]"
                >
                  Entrar
                </Link>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div className="space-y-1.5">
                <input
                  type="text"
                  placeholder="Nome completo"
                  autoComplete="name"
                  className={fieldClass}
                  {...register("name")}
                />
                {errors.name?.message ? <p className="text-xs text-[#ff9db1]">{errors.name.message}</p> : null}
              </div>

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

              <div className="space-y-1.5">
                <select className={`${fieldClass} appearance-none`} {...register("role")}>
                  <option value="member">Perfil: member</option>
                  <option value="guest">Perfil: guest</option>
                </select>
                <p className="text-[11px] text-white/26">
                  O perfil admin existe na plataforma, mas e provisionado apenas pelo backend.
                </p>
              </div>

              <div className="space-y-1.5">
                <input
                  type="password"
                  placeholder="Senha"
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

              <button
                type="submit"
                disabled={isSubmitting}
                className="group mt-1 flex h-[50px] w-full items-center justify-center rounded-[13px] border border-white/8 bg-[linear-gradient(180deg,rgba(108,108,112,0.75),rgba(56,56,61,0.88))] px-4 text-[12px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_18px_40px_rgba(0,0,0,0.24)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="flex-1 text-center">
                  {isSubmitting ? "Criando conta..." : "Criar conta"}
                </span>
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#121214] text-white transition group-hover:translate-x-0.5">
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </button>

              <p className="text-[11px] text-white/30">
                Quer apenas testar a interface antes?{" "}
                <Link href="/forgot-password" className="text-white/55 underline underline-offset-4">
                  Recuperar acesso
                </Link>
              </p>
            </form>

            <div className="max-w-[300px] text-[10px] leading-5 text-white/22">
              Ao criar sua conta, voce concorda com os Termos de Uso, Politica de Privacidade e diretrizes
              de seguranca da plataforma.
            </div>
          </div>
        </div>
      }
    />
  );
}
