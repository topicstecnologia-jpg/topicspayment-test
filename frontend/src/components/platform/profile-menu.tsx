"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import {
  Camera,
  ChevronRight,
  CircleUserRound,
  LogOut,
  PencilLine,
  ShieldCheck,
  Trash2,
  X
} from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { ApiError, authApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  changePasswordSchema,
  deleteAccountSchema,
  updateProfileSchema,
  type ChangePasswordInput,
  type DeleteAccountInput,
  type UpdateProfileInput
} from "@/schemas/profile";

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    return error.message;
  }

  return fallback;
}

function buildProfileDefaults(user: {
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  avatarUrl: string | null;
}): UpdateProfileInput {
  return {
    name: user.name,
    email: user.email,
    phone: user.phone ?? "",
    address: user.address ?? "",
    avatarUrl: user.avatarUrl ?? ""
  };
}

const sectionClass =
  "rounded-[26px] border border-white/8 bg-[linear-gradient(180deg,rgba(23,27,36,0.98),rgba(14,17,24,0.99))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] lg:p-5";

const fieldClass =
  "h-11 w-full rounded-[15px] border border-white/10 bg-white/[0.04] px-4 text-[0.92rem] text-white outline-none transition placeholder:text-white/26 focus:border-[#8c52ff]/70 focus:ring-4 focus:ring-[#8c52ff]/10";

const labelClass = "text-[11px] font-medium uppercase tracking-[0.12em] text-white/54";
const helperClass = "text-[11px] leading-5 text-white/34";
const primaryButtonClass =
  "inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,#8c52ff_0%,#c4a6ff_58%,#ffffff_100%)] px-4 py-2.5 text-sm font-semibold text-[#171a24] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60";
const secondaryButtonClass =
  "inline-flex items-center justify-center rounded-full border border-white/10 bg-transparent px-4 py-2.5 text-sm font-medium text-white/68 transition hover:bg-white/[0.05] hover:text-white";
const dangerButtonClass =
  "inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,#ef476f_0%,#ff8ea4_100%)] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60";

export function ProfileMenu() {
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { user, setUser, signOut } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const profileForm = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: user ? buildProfileDefaults(user) : undefined
  });

  const passwordForm = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    }
  });

  const deleteForm = useForm<DeleteAccountInput>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: {
      password: ""
    }
  });

  const avatarPreview = profileForm.watch("avatarUrl") || user?.avatarUrl || "";

  useEffect(() => {
    if (!user) {
      return;
    }

    profileForm.reset(buildProfileDefaults(user));
  }, [profileForm, user]);

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

  async function onSubmitProfile(values: UpdateProfileInput) {
    setProfileMessage(null);
    setProfileError(null);

    try {
      const response = await authApi.updateProfile(values);
      setUser(response.user);
      profileForm.reset(buildProfileDefaults(response.user));
      setProfileMessage(response.message);
    } catch (error) {
      setProfileError(getErrorMessage(error, "Nao foi possivel atualizar o perfil."));
    }
  }

  async function onSubmitPassword(values: ChangePasswordInput) {
    setPasswordMessage(null);
    setPasswordError(null);

    try {
      const response = await authApi.changePassword(values);
      setUser(response.user);
      passwordForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
      setPasswordMessage(response.message);
    } catch (error) {
      setPasswordError(getErrorMessage(error, "Nao foi possivel redefinir a senha."));
    }
  }

  async function onSubmitDelete(values: DeleteAccountInput) {
    setDeleteError(null);

    try {
      await authApi.deleteAccount(values);
      setUser(null);
      setIsDeleteOpen(false);
      setIsEditOpen(false);
      setIsOpen(false);
      window.location.replace("/login");
    } catch (error) {
      setDeleteError(getErrorMessage(error, "Nao foi possivel excluir a conta."));
    }
  }

  function handleSelectPhoto() {
    fileInputRef.current?.click();
  }

  function handleClearPhoto() {
    profileForm.setValue("avatarUrl", "", {
      shouldDirty: true,
      shouldValidate: true
    });
  }

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setProfileError("A foto precisa ter no maximo 3 MB.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        profileForm.setValue("avatarUrl", reader.result, {
          shouldDirty: true,
          shouldValidate: true
        });
        setProfileMessage("Foto pronta para salvar.");
        setProfileError(null);
      }
    };

    reader.readAsDataURL(file);
    event.target.value = "";
  }

  return (
    <>
      <div ref={dropdownRef} className="relative">
        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          className="inline-flex h-11 items-center gap-3 rounded-full border border-white/8 bg-white/[0.04] px-3 text-sm font-medium text-white transition hover:bg-white/[0.08]"
        >
          {avatarPreview ? (
            <img src={avatarPreview} alt={user.name} className="h-8 w-8 rounded-full object-cover" />
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
              {avatarPreview ? (
                <img src={avatarPreview} alt={user.name} className="h-11 w-11 rounded-full object-cover" />
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
                setIsEditOpen(true);
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

      {isEditOpen ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[rgba(5,8,14,0.78)] px-4 py-4 backdrop-blur-sm lg:px-8">
          <div className="w-full max-w-[1220px] rounded-[32px] border border-white/8 bg-[linear-gradient(180deg,rgba(18,22,30,0.995),rgba(10,13,18,0.995))] p-5 text-white shadow-[0_34px_110px_rgba(0,0,0,0.42)] lg:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-white/30">Meu Perfil</p>
                <h2 className="mt-2 text-[1.32rem] font-semibold tracking-[-0.05em] sm:text-[1.5rem]">
                  Editar conta
                </h2>
                <p className="mt-2 max-w-[620px] text-[0.92rem] text-white/42">
                  Tudo em uma unica tela: identidade, dados principais, seguranca e remocao da conta.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsEditOpen(false);
                  setProfileMessage(null);
                  setPasswordMessage(null);
                  setProfileError(null);
                  setPasswordError(null);
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/8 bg-white/[0.04] text-white/58 transition hover:bg-white/[0.08] hover:text-white"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />

            <div className="mt-5 grid gap-4 xl:grid-cols-[250px_minmax(0,1fr)_330px]">
              <aside className={cn(sectionClass, "flex h-full flex-col justify-between")}>
                <div>
                  <div className="flex items-center gap-3">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt={user.name}
                        className="h-16 w-16 rounded-[20px] object-cover shadow-[0_16px_40px_rgba(0,0,0,0.22)]"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-white/[0.08] text-lg font-semibold text-white shadow-[0_16px_40px_rgba(0,0,0,0.22)]">
                        {initials}
                      </div>
                    )}

                    <div className="min-w-0">
                      <h3 className="truncate text-[1.08rem] font-semibold text-white" title={user.name}>
                        {user.name}
                      </h3>
                      <p className="mt-1 truncate text-[0.8rem] text-white/42" title={user.email}>
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3 rounded-[22px] border border-white/7 bg-white/[0.03] p-3.5">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.22em] text-white/30">Contato</p>
                      <p className="mt-2 truncate text-sm text-white/78">{user.email}</p>
                    </div>

                    <div className="border-t border-white/6 pt-3">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-white/30">Telefone</p>
                      <p className="mt-2 text-sm text-white/78">{user.phone || "Nao informado"}</p>
                    </div>

                    <div className="border-t border-white/6 pt-3">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-white/30">Endereco</p>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/66">
                        {user.address || "Adicione seus dados de endereco para deixar o perfil completo."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 space-y-2.5">
                  <button type="button" onClick={handleSelectPhoto} className={cn(primaryButtonClass, "w-full gap-2")}>
                    <Camera className="h-4 w-4" />
                    Adicionar foto
                  </button>

                  <button type="button" onClick={handleClearPhoto} className={cn(secondaryButtonClass, "w-full")}>
                    Remover foto
                  </button>
                </div>
              </aside>

              <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className={cn(sectionClass, "flex h-full flex-col")}>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/[0.08] text-[#c4a6ff]">
                    <PencilLine className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[1.02rem] font-semibold text-white">Dados do perfil</p>
                    <p className="text-[0.84rem] text-white/42">Atualize os dados principais da sua conta.</p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className={labelClass}>Nome</label>
                    <input className={fieldClass} placeholder="Seu nome" {...profileForm.register("name")} />
                    {profileForm.formState.errors.name ? (
                      <p className="text-xs text-[#ff8ea4]">{profileForm.formState.errors.name.message}</p>
                    ) : null}
                  </div>

                  <div className="space-y-1.5">
                    <label className={labelClass}>E-mail</label>
                    <input className={fieldClass} placeholder="voce@empresa.com" {...profileForm.register("email")} />
                    {profileForm.formState.errors.email ? (
                      <p className="text-xs text-[#ff8ea4]">{profileForm.formState.errors.email.message}</p>
                    ) : null}
                  </div>

                  <div className="space-y-1.5">
                    <label className={labelClass}>Telefone</label>
                    <input className={fieldClass} placeholder="(11) 99999-9999" {...profileForm.register("phone")} />
                    {profileForm.formState.errors.phone ? (
                      <p className="text-xs text-[#ff8ea4]">{profileForm.formState.errors.phone.message}</p>
                    ) : null}
                  </div>

                  <div className="space-y-1.5">
                    <label className={labelClass}>Endereco</label>
                    <input className={fieldClass} placeholder="Rua, numero, bairro" {...profileForm.register("address")} />
                    {profileForm.formState.errors.address ? (
                      <p className="text-xs text-[#ff8ea4]">{profileForm.formState.errors.address.message}</p>
                    ) : null}
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className={labelClass}>Foto de perfil</label>
                    <input
                      className={fieldClass}
                      placeholder="Cole uma URL ou use o botao ao lado para selecionar"
                      {...profileForm.register("avatarUrl")}
                    />
                    {profileForm.formState.errors.avatarUrl ? (
                      <p className="text-xs text-[#ff8ea4]">{profileForm.formState.errors.avatarUrl.message}</p>
                    ) : (
                      <p className={helperClass}>Se preferir, voce pode colar uma URL publica da imagem.</p>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex min-h-[24px] items-center justify-between gap-3">
                  <div className="min-h-[20px]">
                    {profileError ? <p className="text-sm text-[#ff8ea4]">{profileError}</p> : null}
                    {profileMessage ? <p className="text-sm text-[#39b980]">{profileMessage}</p> : null}
                  </div>

                  <button type="submit" disabled={profileForm.formState.isSubmitting} className={primaryButtonClass}>
                    {profileForm.formState.isSubmitting ? "Salvando..." : "Salvar alteracoes"}
                  </button>
                </div>
              </form>

              <div className="grid gap-4">
                <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} className={cn(sectionClass, "flex flex-col")}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/[0.08] text-[#c4a6ff]">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[1.02rem] font-semibold text-white">Seguranca</p>
                      <p className="text-[0.84rem] text-white/42">Redefina a senha sem sair da tela.</p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    <div className="space-y-1.5">
                      <label className={labelClass}>Senha atual</label>
                      <input
                        type="password"
                        className={fieldClass}
                        placeholder="Digite sua senha atual"
                        {...passwordForm.register("currentPassword")}
                      />
                      {passwordForm.formState.errors.currentPassword ? (
                        <p className="text-xs text-[#ff8ea4]">{passwordForm.formState.errors.currentPassword.message}</p>
                      ) : null}
                    </div>

                    <div className="space-y-1.5">
                      <label className={labelClass}>Nova senha</label>
                      <input
                        type="password"
                        className={fieldClass}
                        placeholder="Nova senha"
                        {...passwordForm.register("newPassword")}
                      />
                      {passwordForm.formState.errors.newPassword ? (
                        <p className="text-xs text-[#ff8ea4]">{passwordForm.formState.errors.newPassword.message}</p>
                      ) : null}
                    </div>

                    <div className="space-y-1.5">
                      <label className={labelClass}>Confirmar senha</label>
                      <input
                        type="password"
                        className={fieldClass}
                        placeholder="Confirme a nova senha"
                        {...passwordForm.register("confirmPassword")}
                      />
                      {passwordForm.formState.errors.confirmPassword ? (
                        <p className="text-xs text-[#ff8ea4]">{passwordForm.formState.errors.confirmPassword.message}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-4 flex min-h-[24px] items-center justify-between gap-3">
                    <div className="min-h-[20px]">
                      {passwordError ? <p className="text-sm text-[#ff8ea4]">{passwordError}</p> : null}
                      {passwordMessage ? <p className="text-sm text-[#39b980]">{passwordMessage}</p> : null}
                    </div>

                    <button type="submit" disabled={passwordForm.formState.isSubmitting} className={primaryButtonClass}>
                      {passwordForm.formState.isSubmitting ? "Atualizando..." : "Salvar senha"}
                    </button>
                  </div>
                </form>

                <div className="rounded-[26px] border border-[#ef476f]/24 bg-[linear-gradient(180deg,rgba(49,19,31,0.72),rgba(26,11,18,0.92))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#ef476f]/18 text-[#ff93a7]">
                      <Trash2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[1rem] font-semibold text-white">Excluir conta</p>
                      <p className="mt-2 text-[0.84rem] leading-6 text-white/56">
                        Remocao permanente. O sistema vai pedir sua senha para confirmar.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button type="button" onClick={() => setIsDeleteOpen(true)} className={dangerButtonClass}>
                      Excluir conta
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isDeleteOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(5,8,14,0.74)] px-4 py-5 backdrop-blur-sm">
          <div className="w-full max-w-[520px] rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(18,22,30,0.99),rgba(10,13,18,0.99))] p-5 text-white shadow-[0_30px_90px_rgba(0,0,0,0.4)] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-white/34">Acao permanente</p>
                <h3 className="mt-2 text-[1.45rem] font-semibold tracking-[-0.05em]">Excluir conta</h3>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsDeleteOpen(false);
                  setDeleteError(null);
                  deleteForm.reset({ password: "" });
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/8 bg-white/[0.04] text-white/58 transition hover:bg-white/[0.08] hover:text-white"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 rounded-[20px] border border-[#ef476f]/28 bg-[linear-gradient(180deg,rgba(239,71,111,0.14),rgba(239,71,111,0.04))] p-4">
              <p className="text-base font-semibold text-white">{user.name}</p>
              <p className="mt-2 text-sm leading-6 text-white/56">
                Para confirmar, digite a senha da conta atual. Depois disso, sua conta sera removida permanentemente.
              </p>
            </div>

            <form onSubmit={deleteForm.handleSubmit(onSubmitDelete)} className="mt-5">
              <div className="space-y-1.5">
                <label className={labelClass}>Confirmacao da senha</label>
                <input
                  type="password"
                  className={fieldClass}
                  placeholder="Digite sua senha atual"
                  {...deleteForm.register("password")}
                />
                {deleteForm.formState.errors.password ? (
                  <p className="text-xs text-[#ff8ea4]">{deleteForm.formState.errors.password.message}</p>
                ) : null}
              </div>

              {deleteError ? <p className="mt-3 text-sm text-[#ff8ea4]">{deleteError}</p> : null}

              <div className="mt-5 flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsDeleteOpen(false);
                    setDeleteError(null);
                    deleteForm.reset({ password: "" });
                  }}
                  className={secondaryButtonClass}
                >
                  Cancelar
                </button>
                <button type="submit" disabled={deleteForm.formState.isSubmitting} className={dangerButtonClass}>
                  {deleteForm.formState.isSubmitting ? "Excluindo..." : "Excluir conta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
