"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { useForm } from "react-hook-form";
import {
  BadgeCheck,
  CalendarDays,
  Camera,
  ChevronRight,
  LogOut,
  Mail,
  MapPin,
  PencilLine,
  Phone,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Trash2,
  Upload,
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

function ProfileFact({
  icon: Icon,
  label,
  value,
  tone = "default"
}: {
  icon: typeof Mail;
  label: string;
  value: string;
  tone?: "default" | "success";
}) {
  return (
    <div className="rounded-[22px] border border-white/7 bg-white/[0.03] p-3.5">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-2xl border text-sm",
            tone === "success"
              ? "border-[#39b980]/20 bg-[#39b980]/10 text-[#74f0b2]"
              : "border-white/8 bg-white/[0.05] text-[#c7a8ff]"
          )}
        >
          <Icon className="h-4 w-4" />
        </div>

        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.22em] text-white/30">{label}</p>
          <p className="mt-1 truncate text-sm font-medium text-white/78">{value}</p>
        </div>
      </div>
    </div>
  );
}

function OverviewPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-white/7 bg-white/[0.03] px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.22em] text-white/30">{label}</p>
      <p className="mt-2 text-sm font-medium text-white/82">{value}</p>
    </div>
  );
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
  const [isDragOver, setIsDragOver] = useState(false);
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
  const profileSnapshot = profileForm.watch();

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

  const profileCompletion = useMemo(() => {
    const completionFields = [
      profileSnapshot.name,
      profileSnapshot.email,
      profileSnapshot.phone,
      profileSnapshot.address,
      profileSnapshot.avatarUrl
    ];

    const completedFields = completionFields.filter((value) => typeof value === "string" && value.trim().length > 0);
    return Math.round((completedFields.length / completionFields.length) * 100);
  }, [
    profileSnapshot.address,
    profileSnapshot.avatarUrl,
    profileSnapshot.email,
    profileSnapshot.name,
    profileSnapshot.phone
  ]);

  const joinedOnLabel = useMemo(() => formatDateLabel(user?.createdAt ?? null), [user?.createdAt]);
  const lastUpdatedLabel = useMemo(() => formatDateLabel(user?.updatedAt ?? null), [user?.updatedAt]);

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
    setIsDragOver(false);
    setProfileMessage("Foto removida. Salve para confirmar a alteracao.");
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

    setIsDragOver(false);

    if (!file.type.startsWith("image/")) {
      setProfileError("Envie uma imagem valida em PNG, JPG, WEBP ou GIF.");
      setProfileMessage(null);
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setProfileError("A foto precisa ter no maximo 3 MB.");
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
        setProfileMessage("Foto pronta para salvar.");
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

  function handlePhotoDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setIsDragOver(false);

    const file = event.dataTransfer.files?.[0];

    if (!file) {
      return;
    }

    applyPhotoFile(file);
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
          <div className="w-full max-w-[1280px] rounded-[32px] border border-white/8 bg-[linear-gradient(180deg,rgba(18,22,30,0.995),rgba(10,13,18,0.995))] p-5 text-white shadow-[0_34px_110px_rgba(0,0,0,0.42)] lg:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-white/30">Conta e identidade</p>
                <h2 className="mt-2 text-[1.32rem] font-semibold tracking-[-0.05em] sm:text-[1.5rem]">
                  Central de perfil
                </h2>
                <p className="mt-2 max-w-[620px] text-[0.92rem] text-white/42">
                  Organize sua identidade visual, dados principais e acessos sensiveis em uma interface mais limpa e
                  pronta para operacao diaria.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden rounded-full border border-white/8 bg-white/[0.04] px-4 py-2 text-[0.78rem] text-white/62 sm:flex">
                  Perfil {profileCompletion}% completo
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsEditOpen(false);
                    setIsDragOver(false);
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
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={handlePhotoChange}
            />

            <div className="mt-6 grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
              <aside className={cn(sectionClass, "flex h-full flex-col")}>
                <div>
                  <div className="rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.22em] text-white/30">Minha identidade</p>
                        <p className="mt-2 text-sm font-medium text-white/72">Visual e dados publicos da conta</p>
                      </div>

                      <div className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1 text-[0.72rem] font-medium text-white/68">
                        {profileCompletion}% completo
                      </div>
                    </div>

                    <div className="mt-4 overflow-hidden rounded-[28px] border border-white/8 bg-[#0b0f15]">
                      <div className="relative aspect-[4/4.4] overflow-hidden">
                        {avatarPreview ? (
                          <img src={avatarPreview} alt={user.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(140,82,255,0.35),transparent_56%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.01))]" />
                        )}

                        <div className="absolute inset-0 flex flex-col justify-between p-4">
                          <div className="flex justify-between">
                            <div className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[0.72rem] font-medium text-white/74 backdrop-blur-md">
                              TOPICS Pay
                            </div>

                            <div
                              className={cn(
                                "rounded-full px-3 py-1 text-[0.72rem] font-medium backdrop-blur-md",
                                user.isEmailVerified
                                  ? "border border-[#39b980]/20 bg-[#39b980]/12 text-[#74f0b2]"
                                  : "border border-[#f3b23a]/20 bg-[#f3b23a]/12 text-[#ffd98b]"
                              )}
                            >
                              {user.isEmailVerified ? "Verificado" : "Pendente"}
                            </div>
                          </div>

                          <div>
                            {!avatarPreview ? (
                              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-[26px] border border-white/10 bg-white/[0.06] text-2xl font-semibold text-white shadow-[0_18px_40px_rgba(0,0,0,0.28)]">
                                {initials}
                              </div>
                            ) : null}

                            <p className="text-lg font-semibold text-white">{profileSnapshot.name || user.name}</p>
                            <p className="mt-1 text-sm text-white/60">{profileSnapshot.email || user.email}</p>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-white/8 bg-white/[0.025] p-3">
                        <button
                          type="button"
                          onClick={handleClearPhoto}
                          className="w-full rounded-[16px] border border-[#ef476f]/25 bg-[linear-gradient(135deg,rgba(239,71,111,0.2),rgba(239,71,111,0.08))] px-4 py-3 text-sm font-semibold text-[#ff9aac] transition hover:brightness-110"
                        >
                          Remover imagem atual
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleSelectPhoto}
                      onDragOver={(event) => {
                        event.preventDefault();
                        setIsDragOver(true);
                      }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={handlePhotoDrop}
                      className={cn(
                        "mt-4 flex w-full flex-col items-center rounded-[24px] border border-dashed px-5 py-6 text-center transition",
                        isDragOver
                          ? "border-[#c4a6ff]/70 bg-[#8c52ff]/10"
                          : "border-white/12 bg-white/[0.025] hover:border-white/22 hover:bg-white/[0.04]"
                      )}
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-[#c7a8ff]">
                        <Upload className="h-5 w-5" />
                      </div>
                      <p className="mt-4 text-sm font-medium text-white/78">Arraste uma imagem ou clique para carregar</p>
                      <p className="mt-2 max-w-[220px] text-xs leading-5 text-white/40">
                        PNG, JPG, WEBP ou GIF com ate 3 MB. A nova foto so entra no ar depois de salvar.
                      </p>
                    </button>
                  </div>

                  <div className="mt-4 grid gap-3">
                    <ProfileFact
                      icon={BadgeCheck}
                      label="Status da conta"
                      value={user.isEmailVerified ? "E-mail confirmado" : "Confirmacao pendente"}
                      tone={user.isEmailVerified ? "success" : "default"}
                    />
                    <ProfileFact icon={CalendarDays} label="Membro desde" value={joinedOnLabel} />
                    <ProfileFact icon={ShieldCheck} label="Perfil de acesso" value={formatRoleLabel(user.role)} />
                  </div>
                </div>

                <div className="mt-5 rounded-[24px] border border-white/7 bg-white/[0.03] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#8c52ff]/20 bg-[#8c52ff]/12 text-[#d0b8ff]">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Resumo do perfil</p>
                      <p className="mt-1 text-xs leading-5 text-white/42">
                        Use telefone, endereco e imagem para deixar sua operacao mais confiavel para atendimento e suporte.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 h-2 rounded-full bg-white/[0.05]">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,#8c52ff_0%,#c4a6ff_55%,#ffffff_100%)] transition-all"
                      style={{ width: `${profileCompletion}%` }}
                    />
                  </div>
                </div>
              </aside>

              <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className={cn(sectionClass, "flex h-full flex-col")}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/[0.08] text-[#c4a6ff]">
                      <PencilLine className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[1.02rem] font-semibold text-white">Dados do perfil</p>
                      <p className="text-[0.84rem] text-white/42">
                        Estruture seus dados principais com a mesma linguagem visual do restante da plataforma.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-full border border-white/8 bg-white/[0.03] px-4 py-2 text-xs text-white/56">
                    Ultima atualizacao: {lastUpdatedLabel}
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <OverviewPill label="Perfil" value={formatRoleLabel(user.role)} />
                  <OverviewPill label="E-mail" value={user.isEmailVerified ? "Confirmado" : "Pendente"} />
                  <OverviewPill label="Contato" value={profileSnapshot.phone?.trim() || "Nao informado"} />
                  <OverviewPill label="Endereco" value={profileSnapshot.address?.trim() || "Nao informado"} />
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                  <div className="space-y-1.5">
                    <label className={labelClass}>Nome da conta</label>
                    <input className={fieldClass} placeholder="Seu nome ou nome da operacao" {...profileForm.register("name")} />
                    {profileForm.formState.errors.name ? (
                      <p className="text-xs text-[#ff8ea4]">{profileForm.formState.errors.name.message}</p>
                    ) : (
                      <p className={helperClass}>Esse nome aparece nas areas internas da sua conta.</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className={labelClass}>E-mail principal</label>
                    <input className={fieldClass} placeholder="voce@empresa.com" {...profileForm.register("email")} />
                    {profileForm.formState.errors.email ? (
                      <p className="text-xs text-[#ff8ea4]">{profileForm.formState.errors.email.message}</p>
                    ) : (
                      <p className={helperClass}>Usado para autenticacao e comunicacoes principais.</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className={labelClass}>Telefone / WhatsApp</label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/24" />
                      <input
                        className={cn(fieldClass, "pl-11")}
                        placeholder="(11) 99999-9999"
                        {...profileForm.register("phone")}
                      />
                    </div>
                    {profileForm.formState.errors.phone ? (
                      <p className="text-xs text-[#ff8ea4]">{profileForm.formState.errors.phone.message}</p>
                    ) : (
                      <p className={helperClass}>Ajuda suporte, contato comercial e verificacoes futuras.</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className={labelClass}>Foto por URL</label>
                    <div className="relative">
                      <Camera className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/24" />
                      <input
                        className={cn(fieldClass, "pl-11")}
                        placeholder="https://..."
                        {...profileForm.register("avatarUrl")}
                      />
                    </div>
                    {profileForm.formState.errors.avatarUrl ? (
                      <p className="text-xs text-[#ff8ea4]">{profileForm.formState.errors.avatarUrl.message}</p>
                    ) : (
                      <p className={helperClass}>Se preferir, cole uma URL publica em vez de enviar arquivo.</p>
                    )}
                  </div>

                  <div className="space-y-1.5 lg:col-span-2">
                    <label className={labelClass}>Endereco completo</label>
                    <div className="relative">
                      <MapPin className="pointer-events-none absolute left-4 top-4 h-4 w-4 text-white/24" />
                      <textarea
                        rows={4}
                        className={cn(
                          "w-full rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3 pl-11 text-[0.92rem] text-white outline-none transition placeholder:text-white/26 focus:border-[#8c52ff]/70 focus:ring-4 focus:ring-[#8c52ff]/10",
                          "resize-none"
                        )}
                        placeholder="Rua, numero, bairro, cidade e referencias"
                        {...profileForm.register("address")}
                      />
                    </div>
                    {profileForm.formState.errors.address ? (
                      <p className="text-xs text-[#ff8ea4]">{profileForm.formState.errors.address.message}</p>
                    ) : (
                      <p className={helperClass}>
                        Mantenha esse campo completo para cadastro, faturamento e contato operacional.
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-5 flex min-h-[24px] flex-col gap-3 border-t border-white/8 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-h-[20px]">
                    {profileError ? <p className="text-sm text-[#ff8ea4]">{profileError}</p> : null}
                    {profileMessage ? <p className="text-sm text-[#39b980]">{profileMessage}</p> : null}
                  </div>

                  <button type="submit" disabled={profileForm.formState.isSubmitting} className={cn(primaryButtonClass, "gap-2")}>
                    <BadgeCheck className="h-4 w-4" />
                    {profileForm.formState.isSubmitting ? "Salvando..." : "Salvar informacoes"}
                  </button>
                </div>
              </form>

              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
                <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} className={cn(sectionClass, "flex flex-col")}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/[0.08] text-[#c4a6ff]">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[1.02rem] font-semibold text-white">Seguranca da conta</p>
                      <p className="text-[0.84rem] text-white/42">
                        Atualize sua senha sem sair da tela e mantenha a sessao protegida.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-3">
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
                      <label className={labelClass}>Confirmar nova senha</label>
                      <input
                        type="password"
                        className={fieldClass}
                        placeholder="Repita a nova senha"
                        {...passwordForm.register("confirmPassword")}
                      />
                      {passwordForm.formState.errors.confirmPassword ? (
                        <p className="text-xs text-[#ff8ea4]">{passwordForm.formState.errors.confirmPassword.message}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-5 flex min-h-[24px] flex-col gap-3 border-t border-white/8 pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-h-[20px]">
                      {passwordError ? <p className="text-sm text-[#ff8ea4]">{passwordError}</p> : null}
                      {passwordMessage ? <p className="text-sm text-[#39b980]">{passwordMessage}</p> : null}
                    </div>

                    <button type="submit" disabled={passwordForm.formState.isSubmitting} className={primaryButtonClass}>
                      {passwordForm.formState.isSubmitting ? "Atualizando..." : "Salvar senha"}
                    </button>
                  </div>
                </form>

                <div className="grid gap-4">
                  <div className={cn(sectionClass, "bg-[linear-gradient(180deg,rgba(25,29,40,0.98),rgba(13,16,22,0.99))]")}>
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#8c52ff]/14 text-[#d2bcff]">
                        <ShieldAlert className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[1rem] font-semibold text-white">Blindagem ativa</p>
                        <p className="mt-2 text-[0.84rem] leading-6 text-white/56">
                          Sua conta ja opera com camadas extras de sessao protegida, bloqueio de abuso e verificacao de origem.
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2 text-sm text-white/68">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-[#39b980]" />
                        Sessao reforcada contra reutilizacao indevida
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-[#39b980]" />
                        Protecao de origem para operacoes sensiveis
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-[#39b980]" />
                        Limite de tentativas contra automacao
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[26px] border border-[#ef476f]/24 bg-[linear-gradient(180deg,rgba(49,19,31,0.72),rgba(26,11,18,0.92))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#ef476f]/18 text-[#ff93a7]">
                        <Trash2 className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[1rem] font-semibold text-white">Excluir conta</p>
                        <p className="mt-2 text-[0.84rem] leading-6 text-white/56">
                          Acao permanente. O sistema vai pedir sua senha para confirmar antes de remover a conta.
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
