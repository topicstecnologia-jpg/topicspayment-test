"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import {
  ArrowLeft,
  BadgeCheck,
  Camera,
  MapPin,
  Phone,
  ShieldAlert,
  ShieldCheck,
  UserCircle2,
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

import { usePlatformShell } from "./platform-shell-context";

type ProfileEditorSection = "profile" | "security" | "account";

const editorSections = [
  { id: "profile", label: "Informacoes do perfil", icon: UserCircle2 },
  { id: "security", label: "Seguranca", icon: ShieldCheck },
  { id: "account", label: "Conta e dados", icon: BadgeCheck }
] as const satisfies Array<{
  id: ProfileEditorSection;
  label: string;
  icon: typeof UserCircle2;
}>;

const inputClass =
  "h-12 w-full rounded-[18px] border border-white/10 bg-white/[0.04] px-4 text-white outline-none transition placeholder:text-white/24 focus:border-[#8c52ff]/65 focus:ring-4 focus:ring-[#8c52ff]/10";

const textAreaClass =
  "w-full rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition placeholder:text-white/24 focus:border-[#8c52ff]/65 focus:ring-4 focus:ring-[#8c52ff]/10";

const labelClass = "text-[0.92rem] font-semibold tracking-[-0.03em] text-white/88";

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

function formatRoleLabel(role: "admin" | "member" | "guest") {
  return {
    admin: "Administrador",
    member: "Membro ativo",
    guest: "Convidado"
  }[role];
}

function formatDateLabel(value: string | null) {
  if (!value) {
    return "Nao informado";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Nao informado";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long"
  }).format(date);
}

interface ProfileEditorScreenProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileEditorScreen({ isOpen, onClose }: ProfileEditorScreenProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { user, setUser } = useAuth();
  const { setHeroVisible } = usePlatformShell();

  const [activeSection, setActiveSection] = useState<ProfileEditorSection>("profile");
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

  const profileValues = profileForm.watch();
  const avatarPreview = profileValues.avatarUrl || user?.avatarUrl || "";

  useEffect(() => {
    setHeroVisible(!isOpen);

    return () => {
      setHeroVisible(true);
    };
  }, [isOpen, setHeroVisible]);

  useEffect(() => {
    if (!isOpen || !user) {
      return;
    }

    profileForm.reset(buildProfileDefaults(user));
    passwordForm.reset({
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    });
    deleteForm.reset({ password: "" });
    setActiveSection("profile");
    setProfileMessage(null);
    setProfileError(null);
    setPasswordMessage(null);
    setPasswordError(null);
    setDeleteError(null);
  }, [deleteForm, isOpen, passwordForm, profileForm, user]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (isDeleteOpen) {
          setIsDeleteOpen(false);
          setDeleteError(null);
          deleteForm.reset({ password: "" });
          return;
        }

        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [deleteForm, isDeleteOpen, isOpen, onClose]);

  const initials = useMemo(() => {
    const source = profileValues.name?.trim() || user?.name || "TOPICS Pay";

    return source
      .split(" ")
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
  }, [profileValues.name, user?.name]);

  const joinedOnLabel = useMemo(() => formatDateLabel(user?.createdAt ?? null), [user?.createdAt]);
  const updatedOnLabel = useMemo(() => formatDateLabel(user?.updatedAt ?? null), [user?.updatedAt]);
  const verifiedOnLabel = useMemo(
    () => formatDateLabel(user?.emailVerifiedAt ?? null),
    [user?.emailVerifiedAt]
  );

  if (!isOpen || !user) {
    return null;
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
      setPasswordError(getErrorMessage(error, "Nao foi possivel atualizar a senha."));
    }
  }

  async function onSubmitDelete(values: DeleteAccountInput) {
    setDeleteError(null);

    try {
      await authApi.deleteAccount(values);
      setUser(null);
      setIsDeleteOpen(false);
      onClose();
      window.location.replace("/login");
    } catch (error) {
      setDeleteError(getErrorMessage(error, "Nao foi possivel excluir a conta."));
    }
  }

  function handleSelectPhoto() {
    fileInputRef.current?.click();
  }

  function handleClearPhoto() {
    setProfileMessage("Imagem removida. Salve para aplicar a alteracao.");
    setProfileError(null);
    profileForm.setValue("avatarUrl", "", {
      shouldDirty: true,
      shouldValidate: true
    });
  }

  function applyPhotoFile(file: File) {
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setProfileError("Envie uma imagem valida em PNG, JPG, WEBP ou GIF.");
      setProfileMessage(null);
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setProfileError("A imagem precisa ter no maximo 3 MB.");
      setProfileMessage(null);
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        profileForm.setValue("avatarUrl", reader.result, {
          shouldDirty: true,
          shouldValidate: true
        });
        setProfileMessage("Nova imagem pronta para salvar.");
        setProfileError(null);
      }
    };

    reader.readAsDataURL(file);
  }

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      event.target.value = "";
      return;
    }

    applyPhotoFile(file);
    event.target.value = "";
  }

  return (
    <>
      <div className="fixed inset-0 z-[70] bg-[rgba(5,8,14,0.74)] backdrop-blur-sm" />

      <div className="fixed inset-0 z-[71]">
        <div className="platform-scrollbar h-full overflow-y-auto">
          <div className="min-h-full bg-[radial-gradient(circle_at_top,rgba(140,82,255,0.1),transparent_22%),linear-gradient(180deg,#0a0d13_0%,#090b10_100%)]">
            <div className="mx-auto max-w-[1480px] px-4 py-4 sm:px-6 lg:px-8 lg:py-5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={handlePhotoChange}
              />

              <div className="space-y-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <h2 className="text-[1.7rem] font-semibold tracking-[-0.07em] text-white sm:text-[2rem]">
                    Editar perfil
                  </h2>

                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex items-center justify-center gap-2 self-start rounded-full border border-[#f5b942]/40 bg-transparent px-4 py-2.5 text-sm font-semibold text-[#f5c14d] transition hover:bg-[#f5b942]/8"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar ao painel
                  </button>
                </div>

                <div className="grid gap-6 xl:grid-cols-[248px_minmax(0,1fr)] xl:items-start">
                  <aside className="xl:sticky xl:top-5">
                    <section className="platform-surface rounded-[28px] p-3 sm:p-4">
                      <nav className="space-y-2">
                        {editorSections.map((section) => {
                          const Icon = section.icon;
                          const isActive = activeSection === section.id;

                          return (
                            <button
                              key={section.id}
                              type="button"
                              onClick={() => setActiveSection(section.id)}
                              className={cn(
                                "flex w-full items-center gap-3 rounded-[22px] border px-4 py-3.5 text-left transition",
                                isActive
                                  ? "border-white/10 bg-white/[0.06] text-white shadow-[inset_3px_0_0_0_rgba(255,255,255,0.9)]"
                                  : "border-transparent bg-transparent text-white/56 hover:border-white/8 hover:bg-white/[0.03] hover:text-white/82"
                              )}
                            >
                              <span
                                className={cn(
                                  "flex h-9 w-9 items-center justify-center rounded-[14px]",
                                  isActive ? "bg-white/[0.08] text-white" : "bg-white/[0.04] text-white/54"
                                )}
                              >
                                <Icon className="h-4.5 w-4.5" />
                              </span>
                              <span className="text-[0.96rem] font-semibold tracking-[-0.03em]">
                                {section.label}
                              </span>
                            </button>
                          );
                        })}
                      </nav>
                    </section>
                  </aside>

                  <div className="space-y-4">
                    {activeSection === "profile" ? (
                      <>
                        <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-6">
                          <input type="hidden" {...profileForm.register("avatarUrl")} />

                          <div className="grid gap-8 xl:grid-cols-[380px_minmax(0,1fr)] xl:items-start">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h3 className="text-[1.2rem] font-semibold tracking-[-0.05em] text-white">
                                  Foto de perfil
                                </h3>
                                <span
                                  className={cn(
                                    "rounded-full border px-3 py-1 text-[0.72rem] font-semibold",
                                    user.isEmailVerified
                                      ? "border-[#39b980]/18 bg-[#39b980]/10 text-[#74f0b2]"
                                      : "border-[#f5c463]/18 bg-[#f5c463]/10 text-[#f8d486]"
                                  )}
                                >
                                  {user.isEmailVerified ? "Verificado" : "Pendente"}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={handleSelectPhoto}
                                className="group relative flex aspect-[4/5] w-full items-center justify-center overflow-hidden rounded-[34px] border border-white/10 bg-white/[0.03] transition hover:border-white/18"
                              >
                                {avatarPreview ? (
                                  <img
                                    src={avatarPreview}
                                    alt={profileValues.name || user.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <span className="text-[2.2rem] font-semibold text-white">{initials}</span>
                                )}

                                <div className="absolute inset-x-0 bottom-0 flex items-center justify-center bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.82))] px-4 py-5">
                                  <span className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-black/35 px-4 py-2 text-sm font-semibold text-white/88 backdrop-blur-sm">
                                    <Camera className="h-4 w-4" />
                                    Alterar foto
                                  </span>
                                </div>
                              </button>

                              {avatarPreview ? (
                                <button
                                  type="button"
                                  onClick={handleClearPhoto}
                                  className="inline-flex items-center justify-center rounded-full border border-[#ef476f]/25 bg-[linear-gradient(135deg,rgba(239,71,111,0.18),rgba(239,71,111,0.08))] px-4 py-2.5 text-sm font-semibold text-[#ff96aa] transition hover:brightness-110"
                                >
                                  Remover imagem atual
                                </button>
                              ) : null}
                            </div>

                            <div className="space-y-5">
                              <div className="flex items-center justify-between gap-4">
                                <h3 className="text-[1.2rem] font-semibold tracking-[-0.05em] text-white">
                                  Identidade e contato da conta
                                </h3>
                                <p className="text-[13px] text-white/46">
                                  Atualizado em {updatedOnLabel}
                                </p>
                              </div>

                              <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                  <label className={labelClass}>Nome da conta</label>
                                  <input
                                    className={inputClass}
                                    placeholder="Seu nome ou nome da operacao"
                                    {...profileForm.register("name")}
                                  />
                                  {profileForm.formState.errors.name ? (
                                    <p className="text-xs text-[#ff9db1]">
                                      {profileForm.formState.errors.name.message}
                                    </p>
                                  ) : null}
                                </div>

                                <div className="space-y-2">
                                  <label className={labelClass}>E-mail principal</label>
                                  <input
                                    className={inputClass}
                                    placeholder="voce@empresa.com"
                                    {...profileForm.register("email")}
                                  />
                                  {profileForm.formState.errors.email ? (
                                    <p className="text-xs text-[#ff9db1]">
                                      {profileForm.formState.errors.email.message}
                                    </p>
                                  ) : null}
                                </div>

                                <div className="space-y-2">
                                  <label className={labelClass}>Telefone / WhatsApp</label>
                                  <div className="relative">
                                    <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/24" />
                                    <input
                                      className={cn(inputClass, "pl-11")}
                                      placeholder="(11) 99999-9999"
                                      {...profileForm.register("phone")}
                                    />
                                  </div>
                                  {profileForm.formState.errors.phone ? (
                                    <p className="text-xs text-[#ff9db1]">
                                      {profileForm.formState.errors.phone.message}
                                    </p>
                                  ) : null}
                                </div>

                                <div className="space-y-2">
                                  <label className={labelClass}>Status do e-mail</label>
                                  <div className="flex h-12 items-center rounded-[18px] border border-white/10 bg-white/[0.04] px-4 text-white/78">
                                    {user.isEmailVerified ? "Confirmado" : "Pendente"}
                                  </div>
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                  <label className={labelClass}>Endereco completo</label>
                                  <div className="relative">
                                    <MapPin className="pointer-events-none absolute left-4 top-4 h-4 w-4 text-white/24" />
                                    <textarea
                                      rows={6}
                                      className={cn(textAreaClass, "resize-none pl-11")}
                                      placeholder="Rua, numero, bairro, cidade e referencias"
                                      {...profileForm.register("address")}
                                    />
                                  </div>
                                  {profileForm.formState.errors.address ? (
                                    <p className="text-xs text-[#ff9db1]">
                                      {profileForm.formState.errors.address.message}
                                    </p>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex min-h-[24px] flex-col gap-3 border-t border-white/8 pt-5 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-h-[20px]">
                              {profileError ? <p className="text-sm text-[#ff9db1]">{profileError}</p> : null}
                              {profileMessage ? <p className="text-sm text-[#39b980]">{profileMessage}</p> : null}
                            </div>

                            <button
                              type="submit"
                              disabled={profileForm.formState.isSubmitting}
                              className="topics-gradient inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-[#11161f] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <BadgeCheck className="h-4 w-4" />
                              {profileForm.formState.isSubmitting ? "Salvando..." : "Salvar informacoes"}
                            </button>
                          </div>
                        </form>
                      </>
                    ) : null}

                    {activeSection === "security" ? (
                      <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)}>
                        <section className="platform-surface rounded-[30px] p-5 lg:p-6">
                          <div className="flex flex-col gap-3 border-b border-white/8 pb-5">
                            <h3 className="text-[1.2rem] font-semibold tracking-[-0.05em] text-white">
                              Controle de acesso e blindagem da sessao
                            </h3>
                            <p className="text-[13px] leading-6 text-white/46">
                              Atualize a senha sem sair da tela e acompanhe as protecoes principais que ja estao ativas na conta.
                            </p>
                            <div className="flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-white/56">
                              <span>Verificacao: {user.isEmailVerified ? "E-mail validado" : "Pendente"}</span>
                              <span>Perfil: {formatRoleLabel(user.role)}</span>
                              <span>Membro desde: {joinedOnLabel}</span>
                            </div>
                          </div>

                          <div className="grid gap-4 pt-5 md:grid-cols-3">
                            <div className="space-y-1.5">
                              <label className={labelClass}>Senha atual</label>
                              <input
                                type="password"
                                className={inputClass}
                                placeholder="Digite sua senha atual"
                                {...passwordForm.register("currentPassword")}
                              />
                              {passwordForm.formState.errors.currentPassword ? (
                                <p className="text-xs text-[#ff9db1]">
                                  {passwordForm.formState.errors.currentPassword.message}
                                </p>
                              ) : null}
                            </div>

                            <div className="space-y-1.5">
                              <label className={labelClass}>Nova senha</label>
                              <input
                                type="password"
                                className={inputClass}
                                placeholder="Nova senha"
                                {...passwordForm.register("newPassword")}
                              />
                              {passwordForm.formState.errors.newPassword ? (
                                <p className="text-xs text-[#ff9db1]">
                                  {passwordForm.formState.errors.newPassword.message}
                                </p>
                              ) : null}
                            </div>

                            <div className="space-y-1.5">
                              <label className={labelClass}>Confirmar nova senha</label>
                              <input
                                type="password"
                                className={inputClass}
                                placeholder="Repita a nova senha"
                                {...passwordForm.register("confirmPassword")}
                              />
                              {passwordForm.formState.errors.confirmPassword ? (
                                <p className="text-xs text-[#ff9db1]">
                                  {passwordForm.formState.errors.confirmPassword.message}
                                </p>
                              ) : null}
                            </div>
                          </div>

                          <div className="mt-6 border-t border-white/8 pt-5">
                            <div className="flex items-start gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-[16px] bg-[#8c52ff]/14 text-[#d2bcff]">
                                <ShieldAlert className="h-4.5 w-4.5" />
                              </div>
                              <div className="space-y-2 text-[13px] leading-6 text-white/50">
                                <p>Sessao reforcada contra reutilizacao indevida.</p>
                                <p>Protecao de origem para operacoes sensiveis.</p>
                                <p>Limite de tentativas para login e automacao.</p>
                                <p>Revogacao de sessoes antigas em eventos criticos.</p>
                              </div>
                            </div>
                          </div>

                          <div className="mt-6 flex min-h-[24px] flex-col gap-3 border-t border-white/8 pt-5 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-h-[20px]">
                              {passwordError ? <p className="text-sm text-[#ff9db1]">{passwordError}</p> : null}
                              {passwordMessage ? <p className="text-sm text-[#39b980]">{passwordMessage}</p> : null}
                            </div>

                            <button
                              type="submit"
                              disabled={passwordForm.formState.isSubmitting}
                              className="topics-gradient inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold text-[#11161f] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {passwordForm.formState.isSubmitting ? "Atualizando..." : "Salvar nova senha"}
                            </button>
                          </div>
                        </section>
                      </form>
                    ) : null}

                    {activeSection === "account" ? (
                      <section className="platform-surface rounded-[30px] p-5 lg:p-6">
                        <div className="flex flex-col gap-3 border-b border-white/8 pb-5">
                          <h3 className="text-[1.2rem] font-semibold tracking-[-0.05em] text-white">
                            Dados institucionais e estado da conta
                          </h3>
                          <p className="text-[13px] leading-6 text-white/46">
                            Leitura rapida do estado atual da conta e acesso a acoes permanentes.
                          </p>
                        </div>

                        <div className="grid gap-x-8 gap-y-5 pt-5 md:grid-cols-2">
                          <div>
                            <p className="text-[13px] font-medium text-white/42">E-mail atual</p>
                            <p className="mt-2 text-[0.98rem] font-semibold tracking-[-0.03em] text-white">
                              {user.email}
                            </p>
                          </div>
                          <div>
                            <p className="text-[13px] font-medium text-white/42">Verificado em</p>
                            <p className="mt-2 text-[0.98rem] font-semibold tracking-[-0.03em] text-white">
                              {verifiedOnLabel}
                            </p>
                          </div>
                          <div>
                            <p className="text-[13px] font-medium text-white/42">Membro desde</p>
                            <p className="mt-2 text-[0.98rem] font-semibold tracking-[-0.03em] text-white">
                              {joinedOnLabel}
                            </p>
                          </div>
                          <div>
                            <p className="text-[13px] font-medium text-white/42">Perfil de acesso</p>
                            <p className="mt-2 text-[0.98rem] font-semibold tracking-[-0.03em] text-white">
                              {formatRoleLabel(user.role)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-6 flex flex-col gap-4 border-t border-white/8 pt-5 lg:flex-row lg:items-center lg:justify-between">
                          <div className="max-w-[700px]">
                            <p className="text-[0.98rem] font-semibold tracking-[-0.03em] text-white">
                              Exclusao permanente da conta
                            </p>
                            <p className="mt-2 text-[13px] leading-6 text-white/50">
                              Essa acao remove a conta de forma definitiva. O sistema ainda pedira sua senha para confirmar antes de concluir.
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => setIsDeleteOpen(true)}
                            className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,#ef476f_0%,#ff8ea4_100%)] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-105"
                          >
                            Excluir conta
                          </button>
                        </div>
                      </section>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isDeleteOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(5,8,14,0.78)] px-4 py-5 backdrop-blur-sm">
          <div className="w-full max-w-[540px] rounded-[30px] border border-white/8 bg-[linear-gradient(180deg,rgba(18,22,30,0.99),rgba(10,13,18,0.99))] p-5 text-white shadow-[0_30px_90px_rgba(0,0,0,0.4)] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[0.82rem] font-semibold tracking-[-0.02em] text-white/40">
                  Acao permanente
                </p>
                <h3 className="mt-2 text-[1.45rem] font-semibold tracking-[-0.05em] text-white">
                  Excluir conta
                </h3>
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

            <div className="mt-5 rounded-[22px] border border-[#ef476f]/28 bg-[linear-gradient(180deg,rgba(239,71,111,0.14),rgba(239,71,111,0.04))] p-4">
              <p className="text-base font-semibold text-white">{user.name}</p>
              <p className="mt-2 text-sm leading-6 text-white/56">
                Para confirmar, digite a senha da conta atual. Depois disso, a conta sera removida permanentemente.
              </p>
            </div>

            <form onSubmit={deleteForm.handleSubmit(onSubmitDelete)} className="mt-5">
              <div className="space-y-1.5">
                <label className={labelClass}>Confirmacao da senha</label>
                <input
                  type="password"
                  className={inputClass}
                  placeholder="Digite sua senha atual"
                  {...deleteForm.register("password")}
                />
                {deleteForm.formState.errors.password ? (
                  <p className="text-xs text-[#ff9db1]">
                    {deleteForm.formState.errors.password.message}
                  </p>
                ) : null}
              </div>

              {deleteError ? <p className="mt-3 text-sm text-[#ff9db1]">{deleteError}</p> : null}

              <div className="mt-5 flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsDeleteOpen(false);
                    setDeleteError(null);
                    deleteForm.reset({ password: "" });
                  }}
                  className="inline-flex items-center justify-center rounded-full border border-white/10 bg-transparent px-4 py-2.5 text-sm font-medium text-white/68 transition hover:bg-white/[0.05] hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={deleteForm.formState.isSubmitting}
                  className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,#ef476f_0%,#ff8ea4_100%)] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                >
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
