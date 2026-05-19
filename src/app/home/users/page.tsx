"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { MANAGE_USERS_PERMISSION } from "@/lib/permissions";
import { useTRPC } from "@/trpc/react";

type ModalMode = "create" | "edit";

type UserFormState = {
  name: string;
  email: string;
  phone: string;
  roleId: number;
  departmentId: number;
  password: string;
  photoDataUrl: string | null;
};

type ListedUser = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: {
    id: number;
    name: string;
  };
  department: {
    id: number;
    name: string;
  };
  permissions: Array<{
    id: number;
    name: string;
  }>;
  photoDataUrl: string | null;
};

const EMPTY_FORM: UserFormState = {
  name: "",
  email: "",
  phone: "",
  roleId: 0,
  departmentId: 0,
  password: "",
  photoDataUrl: null,
};

const MAX_PHOTO_SIZE_BYTES = 512 * 1024;
const ALLOWED_PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Falha ao ler imagem."));
    };

    reader.onerror = () => {
      reject(new Error("Falha ao ler imagem."));
    };

    reader.readAsDataURL(file);
  });
}

function getInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (!parts.length) return "U";

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

export default function UsersPage() {
  const router = useRouter();
  const trpc = useTRPC();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [formError, setFormError] = useState("");
  const [pageMessage, setPageMessage] = useState("");
  const [pageError, setPageError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [resetPasswordTarget, setResetPasswordTarget] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [form, setForm] = useState<UserFormState>(EMPTY_FORM);

  const meQuery = useQuery(trpc.user.me.queryOptions());
  const canManageUsers =
    meQuery.data?.role.permissions.some(
      (permission) => permission.name === MANAGE_USERS_PERMISSION
    ) ?? false;

  const usersQuery = useQuery({
    ...trpc.user.list.queryOptions(),
    enabled: canManageUsers,
  });

  const optionsQuery = useQuery({
    ...trpc.user.formOptions.queryOptions(),
    enabled: canManageUsers,
  });

  const createUserMutation = useMutation(
    trpc.user.create.mutationOptions({
      onSuccess: async () => {
        setIsUserModalOpen(false);
        setFormError("");
        setPageError("");
        setPageMessage("Usuario cadastrado com sucesso.");
        await usersQuery.refetch();
      },
      onError: (error) => {
        setPageMessage("");
        setFormError(error.message);
      },
    })
  );

  const updateUserMutation = useMutation(
    trpc.user.update.mutationOptions({
      onSuccess: async () => {
        setIsUserModalOpen(false);
        setFormError("");
        setPageError("");
        setPageMessage("Usuario atualizado com sucesso.");
        await usersQuery.refetch();
      },
      onError: (error) => {
        setPageMessage("");
        setFormError(error.message);
      },
    })
  );

  const deleteUserMutation = useMutation(
    trpc.user.delete.mutationOptions({
      onSuccess: async () => {
        setDeleteTarget(null);
        setPageError("");
        setPageMessage("Usuario excluido com sucesso.");
        await usersQuery.refetch();
      },
      onError: (error) => {
        setPageMessage("");
        setPageError(error.message);
      },
    })
  );

  const resetPasswordMutation = useMutation(
    trpc.user.resetPassword.mutationOptions({
      onSuccess: () => {
        const userName = resetPasswordTarget?.name ?? "usuario";

        setResetPasswordTarget(null);
        setPageError("");
        setPageMessage(`Senha de ${userName} redefinida para a senha padrao.`);
      },
      onError: (error) => {
        setPageMessage("");
        setPageError(error.message);
      },
    })
  );

  useEffect(() => {
    if (meQuery.isLoading || !meQuery.data) {
      return;
    }

    if (!canManageUsers) {
      router.replace("/perfil");
    }
  }, [canManageUsers, meQuery.data, meQuery.isLoading, router]);

  const openCreateModal = () => {
    const roles = optionsQuery.data?.roles ?? [];
    const departments = optionsQuery.data?.departments ?? [];

    setModalMode("create");
    setEditingUserId(null);
    setFormError("");
    setForm({
      ...EMPTY_FORM,
      roleId: roles[0]?.id ?? 0,
      departmentId: departments[0]?.id ?? 0,
      photoDataUrl: null,
    });
    setIsUserModalOpen(true);
  };

  const openEditModal = (user: ListedUser) => {
    setModalMode("edit");
    setEditingUserId(user.id);
    setFormError("");
    setForm({
      name: user.name,
      email: user.email,
      phone: user.phone ?? "",
      roleId: user.role.id,
      departmentId: user.department.id,
      password: "",
      photoDataUrl: user.photoDataUrl,
    });
    setIsUserModalOpen(true);
  };

  const handleFormChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: name === "roleId" || name === "departmentId" ? Number(value) : value,
    }));
  };

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!ALLOWED_PHOTO_TYPES.has(file.type)) {
      setFormError("Formato de imagem invalido. Use JPG, PNG, WEBP ou GIF.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      setFormError("A imagem deve ter no maximo 512KB.");
      event.target.value = "";
      return;
    }

    try {
      const photoDataUrl = await fileToDataUrl(file);
      setForm((current) => ({
        ...current,
        photoDataUrl,
      }));
      setFormError("");
    } catch {
      setFormError("Nao foi possivel processar a imagem selecionada.");
    }

    event.target.value = "";
  };

  const removeSelectedPhoto = () => {
    setForm((current) => ({
      ...current,
      photoDataUrl: null,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");

    if (!form.roleId || !form.departmentId) {
      setFormError("Selecione cargo e departamento.");
      return;
    }

    if (modalMode === "create") {
      await createUserMutation.mutateAsync({
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        roleId: form.roleId,
        departmentId: form.departmentId,
        password: form.password,
        photoDataUrl: form.photoDataUrl,
      });
      return;
    }

    if (!editingUserId) {
      setFormError("Usuario invalido para edicao.");
      return;
    }

    await updateUserMutation.mutateAsync({
      id: editingUserId,
      name: form.name,
      email: form.email,
      phone: form.phone || null,
      roleId: form.roleId,
      departmentId: form.departmentId,
      password: form.password || undefined,
      photoDataUrl: form.photoDataUrl,
    });
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  const isSaving = createUserMutation.isPending || updateUserMutation.isPending;

  if (meQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#efefef] font-[Poppins,sans-serif] text-[#555]">
        Carregando...
      </div>
    );
  }

  if (!meQuery.data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#efefef] px-4 font-[Poppins,sans-serif]">
        <div className="w-full max-w-xl rounded-2xl bg-white p-8 text-center shadow-md">
          <p className="text-[#cc2c2c]">Nao foi possivel carregar a sessao.</p>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="mt-4 rounded-full bg-[#2ea03b] px-6 py-2 text-sm font-semibold text-white"
          >
            Voltar ao login
          </button>
        </div>
      </div>
    );
  }

  if (!canManageUsers) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#efefef] font-[Poppins,sans-serif] text-[#555]">
        Redirecionando para perfil...
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#efefef] font-[Poppins,sans-serif]">
      <style>{`
        .table-grid {
          display: grid;
          grid-template-columns: 70px 1.3fr 1fr 1fr 1fr 1.1fr 1.7fr 0.8fr;
          align-items: center;
          gap: 8px;
        }
        @media (max-width: 1300px) {
          .table-grid { min-width: 1150px; }
        }
        .shadow-soft { box-shadow: 0 10px 30px rgba(0,0,0,.08); }
        .shadow-nav { box-shadow: inset 0 1px 0 rgba(255,255,255,.08); }
      `}</style>

      <div className="flex min-h-screen">
        <aside
          className={`relative flex flex-col overflow-hidden bg-[#2ea03b] py-8 text-white transition-all duration-300 ${
            isSidebarOpen ? "w-75 px-6" : "w-20 px-3"
          }`}
        >
          <div
            className={`mb-12 flex items-start transition-all duration-200 ${
              isSidebarOpen ? "justify-between gap-4" : "flex-col items-center gap-4"
            }`}
          >
            <div
              className={`flex items-center overflow-hidden transition-all duration-200 ${
                isSidebarOpen ? "gap-4" : "gap-0"
              }`}
            >
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/20 text-[20px] font-semibold text-white shadow-lg ring-4 ring-white/15">
                {meQuery.data?.photoDataUrl ? (
                  <Image
                    src={meQuery.data.photoDataUrl}
                    alt={`Foto de ${meQuery.data.name}`}
                    width={64}
                    height={64}
                    unoptimized
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>{getInitials(meQuery.data?.name ?? "Usuario")}</span>
                )}
              </div>
              <div
                className={`min-w-0 overflow-hidden transition-all duration-200 ${
                  isSidebarOpen ? "max-w-55 opacity-100" : "max-w-0 opacity-0"
                }`}
              >
                <h2 className="text-[24px] font-semibold leading-none">
                  {meQuery.data?.name?.split(" ")[0] ?? "Usuario"}
                </h2>
                <p className="mt-1 text-[18px] leading-tight text-white/75">
                  {meQuery.data?.role.name ?? "Sem cargo"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsSidebarOpen((current) => !current)}
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/12 text-white transition hover:bg-white/20"
              aria-label={isSidebarOpen ? "Fechar sidebar" : "Abrir sidebar"}
              title={isSidebarOpen ? "Fechar sidebar" : "Abrir sidebar"}
            >
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 6h18" />
                <path d="M3 12h18" />
                <path d="M3 18h18" />
              </svg>
            </button>
          </div>

          <nav className="space-y-3 text-[18px] font-medium">
            <button
              type="button"
              onClick={() => router.push("/home")}
              className={`shadow-nav flex w-full rounded-2xl py-3 transition hover:bg-white/10 ${
                isSidebarOpen ? "items-center gap-4 px-3" : "justify-center px-0"
              }`}
            >
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 3h7v4h-7v-4zm0-3h7v1h-7v-1z" />
              </svg>
              <span
                className={`overflow-hidden whitespace-nowrap text-left text-[17px] transition-all duration-200 ${
                  isSidebarOpen ? "max-w-40 opacity-100" : "max-w-0 opacity-0"
                }`}
              >
                Inicio
              </span>
            </button>

            <button
              type="button"
              className={`shadow-nav flex w-full rounded-2xl bg-[#228d2e] py-3 ${
                isSidebarOpen ? "items-center gap-4 px-3" : "justify-center px-0"
              }`}
            >
              <svg
                className="h-7 w-7"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M7 3h8l4 4v14H5V3h2z" />
                <path d="M15 3v5h5" />
                <path d="M8 11h8M8 15h8M8 7h3" />
              </svg>
              <span
                className={`overflow-hidden whitespace-nowrap text-left text-[17px] transition-all duration-200 ${
                  isSidebarOpen ? "max-w-40 opacity-100" : "max-w-0 opacity-0"
                }`}
              >
                Usuarios
              </span>
            </button>

            <button
              type="button"
              onClick={() => router.push("/home/roles")}
              className={`shadow-nav flex w-full rounded-2xl py-3 transition hover:bg-white/10 ${
                isSidebarOpen ? "items-center gap-4 px-3" : "justify-center px-0"
              }`}
            >
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 1.75 1.75 12 12 22.25 22.25 12 12 1.75Zm0 2.5 7.75 7.75L12 19.75 4.25 12 12 4.25Zm-1.25 3v3.5H7.25V13h3.5v3.5H13V13h3.5v-2.25H13v-3.5h-2.25Z" />
              </svg>
              <span
                className={`overflow-hidden whitespace-nowrap text-left text-[17px] transition-all duration-200 ${
                  isSidebarOpen ? "max-w-40 opacity-100" : "max-w-0 opacity-0"
                }`}
              >
                Cargos
              </span>
            </button>

            <button
              type="button"
              onClick={() => router.push("/home/departments")}
              className={`shadow-nav flex w-full rounded-2xl py-3 transition hover:bg-white/10 ${
                isSidebarOpen ? "items-center gap-4 px-3" : "justify-center px-0"
              }`}
            >
              <svg
                className="h-7 w-7"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M3 7h18" />
                <path d="M6 3h12v4H6z" />
                <path d="M6 11h12v10H6z" />
              </svg>
              <span
                className={`overflow-hidden whitespace-nowrap text-left text-[17px] transition-all duration-200 ${
                  isSidebarOpen ? "max-w-40 opacity-100" : "max-w-0 opacity-0"
                }`}
              >
                Departamentos
              </span>
            </button>

            <button
              type="button"
              onClick={() => router.push("/perfil")}
              className={`shadow-nav flex w-full rounded-2xl py-3 transition hover:bg-white/10 ${
                isSidebarOpen ? "items-center gap-4 px-3" : "justify-center px-0"
              }`}
            >
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.33 0-8 2.17-8 5v1h16v-1c0-2.83-3.67-5-8-5Z" />
              </svg>
              <span
                className={`overflow-hidden whitespace-nowrap text-left text-[17px] transition-all duration-200 ${
                  isSidebarOpen ? "max-w-40 opacity-100" : "max-w-0 opacity-0"
                }`}
              >
                Perfil
              </span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className={`shadow-nav mt-1 flex w-full rounded-2xl py-3 transition hover:bg-white/10 ${
                isSidebarOpen ? "items-center gap-4 px-3" : "justify-center px-0"
              }`}
            >
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 17v-2H3V9h7V7l4 5-4 5Zm4 4h3a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-3v2h3v14h-3v2Z" />
              </svg>
              <span
                className={`overflow-hidden whitespace-nowrap text-left text-[17px] transition-all duration-200 ${
                  isSidebarOpen ? "max-w-40 opacity-100" : "max-w-0 opacity-0"
                }`}
              >
                Sair
              </span>
            </button>
          </nav>
        </aside>

        <main className="relative flex-1 px-16 pb-16 pt-20">
          <div className="mx-auto max-w-350 pt-16">
            <div className="mb-8 flex items-center justify-between gap-4">
              <h1 className="text-[30px] font-bold text-[#1f1f1f]">Usuarios</h1>

              <div className="flex items-center gap-3">
                <button
                  onClick={openCreateModal}
                  disabled={optionsQuery.isLoading || !!optionsQuery.error}
                  className="shadow-soft rounded-2xl bg-[#37a93f] px-6 py-3 text-[18px] font-semibold text-white transition hover:bg-[#2f9737] disabled:cursor-not-allowed disabled:bg-[#9acfa0]"
                >
                  Adicionar usuario
                </button>
              </div>
            </div>

            {pageMessage && (
              <div className="mb-4 rounded-2xl border border-[#94d89b] bg-[#effaf0] px-4 py-3 text-[14px] font-medium text-[#23652a]">
                {pageMessage}
              </div>
            )}

            {pageError && (
              <div className="mb-4 rounded-2xl border border-[#ebb0b0] bg-[#fff0f0] px-4 py-3 text-[14px] font-medium text-[#a02f2f]">
                {pageError}
              </div>
            )}

            {usersQuery.isLoading ? (
              <div className="rounded-2xl bg-white p-8 text-center text-[#666] shadow-soft">
                Carregando usuarios...
              </div>
            ) : usersQuery.error ? (
              <div className="rounded-2xl bg-white p-8 text-center text-[#c73535] shadow-soft">
                {usersQuery.error.message}
              </div>
            ) : (
              <div className="rounded-3xl bg-transparent">
                <div className="overflow-x-auto">
                  <div className="min-w-full">
                    <div className="table-grid mb-2 rounded-xl bg-[#f6f6f6] px-6 py-4 text-[14px] font-semibold text-[#222] shadow-sm">
                      <div>ID</div>
                      <div>Nome</div>
                      <div>Cargo</div>
                      <div>Departamento</div>
                      <div>Telefone</div>
                      <div>Email</div>
                      <div>Permissoes do cargo</div>
                      <div className="text-center">Opcoes</div>
                    </div>

                    <div className="shadow-soft divide-y divide-black/5 rounded-xl bg-white text-[13px] text-[#5b5b5b]">
                      {usersQuery.data?.map((user) => (
                        <div key={user.id} className="table-grid px-6 py-5">
                          <div>{user.id}</div>
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#d8e9da] text-[12px] font-semibold text-[#2a6d2f]">
                              {user.photoDataUrl ? (
                                <Image
                                  src={user.photoDataUrl}
                                  alt={`Foto de ${user.name}`}
                                  width={40}
                                  height={40}
                                  unoptimized
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <span>{getInitials(user.name)}</span>
                              )}
                            </div>
                            <span className="font-medium text-[#1f1f1f]">{user.name}</span>
                          </div>
                          <div>{user.role.name}</div>
                          <div>{user.department.name}</div>
                          <div>{user.phone || "-"}</div>
                          <div className="truncate pr-2">{user.email}</div>
                          <div className="flex flex-wrap gap-1">
                            {user.permissions.length === 0 ? (
                              <span className="text-[#999]">Sem permissoes</span>
                            ) : (
                              user.permissions.map((permission) => (
                                <span
                                  key={permission.id}
                                  className="rounded-full bg-[#eef8ef] px-2 py-1 text-[11px] font-semibold text-[#246f2a]"
                                >
                                  {permission.name}
                                </span>
                              ))
                            )}
                          </div>
                          <div className="flex items-center justify-center gap-4 text-[16px]">
                            <button
                              onClick={() => openEditModal(user)}
                              className="text-blue-600 transition hover:scale-110"
                              title="Editar"
                            >
                              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="m3 17.25 9.81-9.81 2.75 2.75L5.75 20H3v-2.75Zm14.71-9.04a1.003 1.003 0 0 0 0-1.42l-1.5-1.5a1.003 1.003 0 0 0-1.42 0l-1.17 1.17 2.75 2.75 1.34-1Z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setResetPasswordTarget({ id: user.id, name: user.name })}
                              className="text-amber-600 transition hover:scale-110"
                              title="Resetar senha"
                            >
                              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2a7 7 0 0 0-7 7v2H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-1V9a7 7 0 0 0-7-7Zm5 9H7V9a5 5 0 1 1 10 0v2Zm-5 3a2 2 0 0 1 1 3.73V19h-2v-1.27A2 2 0 0 1 12 14Z" />
                              </svg>
                            </button>

                            <button
                              onClick={() => setDeleteTarget({ id: user.id, name: user.name })}
                              className="text-red-600 transition hover:scale-110"
                              title="Excluir"
                            >
                              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 6h2v8h-2V9Zm4 0h2v8h-2V9ZM7 9h2v8H7V9Zm-1 11h12a2 2 0 0 0 2-2V8H4v10a2 2 0 0 0 2 2Z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>

      {isUserModalOpen && (
        <div
          onClick={() => setIsUserModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8"
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="shadow-soft max-h-[92vh] w-full max-w-175 overflow-y-auto rounded-3xl bg-white p-10"
          >
            <h2 className="border-b border-black/20 pb-4 text-center text-[26px] font-bold text-[#1f1f1f]">
              {modalMode === "edit" ? "Editar usuario" : "Cadastrar usuario"}
            </h2>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="rounded-2xl border border-black/15 bg-[#f9fbf9] p-5">
                <p className="mb-3 text-[15px] font-semibold text-[#1f1f1f]">Foto de perfil</p>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-black/15 bg-[#dfeee1] text-[22px] font-semibold text-[#2a6d2f]">
                    {form.photoDataUrl ? (
                      <Image
                        src={form.photoDataUrl}
                        alt="Preview da foto"
                        width={96}
                        height={96}
                        unoptimized
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span>{getInitials(form.name || "Usuario")}</span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <label className="cursor-pointer rounded-xl bg-[#2ea03b] px-4 py-2 text-[14px] font-semibold text-white transition hover:bg-[#258a31]">
                      {form.photoDataUrl ? "Trocar foto" : "Adicionar foto"}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={removeSelectedPhoto}
                      disabled={!form.photoDataUrl}
                      className="rounded-xl bg-[#a7a7a7] px-4 py-2 text-[14px] font-semibold text-white transition hover:bg-[#8b8b8b] disabled:cursor-not-allowed disabled:bg-[#d0d0d0]"
                    >
                      Remover foto
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-[12px] text-[#6f6f6f]">
                  Formatos aceitos: JPG, PNG, WEBP ou GIF. Tamanho maximo: 512KB.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="name" className="mb-1 block text-[15px] text-[#1f1f1f]">
                    Nome completo
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="nome e sobrenome"
                    value={form.name}
                    onChange={handleFormChange}
                    required
                    className="w-full rounded-full border border-black/30 px-5 py-2.5 text-[15px] text-[#333] outline-none transition focus:border-[#2ea03b]"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="mb-1 block text-[15px] text-[#1f1f1f]">
                    Telefone
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="(88) 91234-5678"
                    value={form.phone}
                    onChange={handleFormChange}
                    className="w-full rounded-full border border-black/30 px-5 py-2.5 text-[15px] text-[#333] outline-none transition focus:border-[#2ea03b]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="mb-1 block text-[15px] text-[#1f1f1f]">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="usuario@ifce.edu.br"
                  value={form.email}
                  onChange={handleFormChange}
                  required
                  className="w-full rounded-full border border-black/30 px-5 py-2.5 text-[15px] text-[#333] outline-none transition focus:border-[#2ea03b]"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="roleId" className="mb-1 block text-[15px] text-[#1f1f1f]">
                    Cargo
                  </label>
                  <select
                    id="roleId"
                    name="roleId"
                    value={form.roleId}
                    onChange={handleFormChange}
                    className="w-full rounded-full border border-black/30 bg-white px-5 py-2.5 text-[15px] text-[#333] outline-none transition focus:border-[#2ea03b]"
                  >
                    {(optionsQuery.data?.roles ?? []).map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="departmentId"
                    className="mb-1 block text-[15px] text-[#1f1f1f]"
                  >
                    Departamento/Area
                  </label>
                  <select
                    id="departmentId"
                    name="departmentId"
                    value={form.departmentId}
                    onChange={handleFormChange}
                    className="w-full rounded-full border border-black/30 bg-white px-5 py-2.5 text-[15px] text-[#333] outline-none transition focus:border-[#2ea03b]"
                  >
                    {(optionsQuery.data?.departments ?? []).map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="password" className="mb-1 block text-[15px] text-[#1f1f1f]">
                  Senha de acesso
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder={
                    modalMode === "edit" ? "deixe em branco para manter" : "minimo 6 caracteres"
                  }
                  value={form.password}
                  onChange={handleFormChange}
                  required={modalMode === "create"}
                  className="w-full rounded-full border border-black/30 px-5 py-2.5 text-[15px] text-[#333] outline-none transition focus:border-[#2ea03b]"
                />
              </div>

              {formError && <p className="text-center text-[13px] text-[#d92d2d]">{formError}</p>}

              <div className="flex justify-center gap-6 pt-4">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="rounded-xl bg-[#d92d2d] px-8 py-2.5 text-[16px] font-semibold text-white transition hover:bg-[#bf2525]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-[#2ea03b] px-8 py-2.5 text-[16px] font-semibold text-white transition hover:bg-[#258a31] disabled:cursor-not-allowed disabled:bg-[#9acfa0]"
                >
                  {isSaving
                    ? "Salvando..."
                    : modalMode === "edit"
                      ? "Salvar"
                      : "Cadastrar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8">
          <div className="shadow-soft w-full max-w-110 rounded-3xl bg-white p-8">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <svg
                  className="h-8 w-8 text-[#d92d2d]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <h2 className="text-[22px] font-bold text-[#1f1f1f]">Confirmar exclusao</h2>
              <p className="mt-3 text-[15px] text-[#555]">
                Deseja excluir o usuario <span className="font-semibold">&quot;{deleteTarget.name}&quot;</span>?
              </p>
              <p className="mt-1 text-[13px] text-[#888]">Esta acao nao pode ser desfeita.</p>

              <div className="mt-6 flex w-full justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="rounded-xl bg-[#9a9a9a] px-8 py-2.5 text-[16px] font-semibold text-white transition hover:bg-[#7a7a7a]"
                >
                  Nao
                </button>
                <button
                  type="button"
                  onClick={() => deleteUserMutation.mutate({ id: deleteTarget.id })}
                  disabled={deleteUserMutation.isPending}
                  className="rounded-xl bg-[#d92d2d] px-8 py-2.5 text-[16px] font-semibold text-white transition hover:bg-[#bf2525] disabled:cursor-not-allowed disabled:bg-[#e4a3a3]"
                >
                  {deleteUserMutation.isPending ? "Excluindo..." : "Sim"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {resetPasswordTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8">
          <div className="shadow-soft w-full max-w-125 rounded-3xl bg-white p-8">
            <h2 className="text-center text-[22px] font-bold text-[#1f1f1f]">Resetar senha</h2>
            <p className="mt-4 text-center text-[15px] text-[#555]">
              Deseja resetar a senha de <span className="font-semibold">{resetPasswordTarget.name}</span> para a senha padrao configurada no ambiente?
            </p>
            <p className="mt-2 text-center text-[13px] text-[#888]">
              Variavel utilizada: DEFAULT_RESET_PASSWORD.
            </p>

            <div className="mt-6 flex justify-center gap-4">
              <button
                type="button"
                onClick={() => setResetPasswordTarget(null)}
                className="rounded-xl bg-[#a2a2a2] px-8 py-2.5 text-[16px] font-semibold text-white transition hover:bg-[#7f7f7f]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => resetPasswordMutation.mutate({ id: resetPasswordTarget.id })}
                disabled={resetPasswordMutation.isPending}
                className="rounded-xl bg-[#e19a1e] px-8 py-2.5 text-[16px] font-semibold text-white transition hover:bg-[#cb8918] disabled:cursor-not-allowed disabled:bg-[#ecc888]"
              >
                {resetPasswordMutation.isPending ? "Resetando..." : "Resetar senha"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
