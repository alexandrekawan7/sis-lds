"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

import { MANAGE_USERS_PERMISSION } from "@/lib/permissions";
import { useTRPC } from "@/trpc/react";

type RoleFormState = {
  name: string;
  permissionIds: number[];
};

type ModalMode = "create" | "edit";

type RoleItem = {
  id: number;
  name: string;
  permissions: Array<{
    id: number;
    name: string;
  }>;
  _count: {
    users: number;
  };
};

const EMPTY_FORM: RoleFormState = {
  name: "",
  permissionIds: [],
};

export default function RolesPage() {
  const router = useRouter();
  const trpc = useTRPC();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<RoleItem | null>(null);
  const [form, setForm] = useState<RoleFormState>(EMPTY_FORM);

  const meQuery = useQuery(trpc.user.me.queryOptions());
  const canManageUsers =
    meQuery.data?.role.permissions.some(
      (permission) => permission.name === MANAGE_USERS_PERMISSION
    ) ?? false;

  const rolesQuery = useQuery({
    ...trpc.role.list.queryOptions(),
    enabled: canManageUsers,
  });

  const permissionOptionsQuery = useQuery({
    ...trpc.role.permissionOptions.queryOptions(),
    enabled: canManageUsers,
  });

  const createRoleMutation = useMutation(
    trpc.role.create.mutationOptions({
      onSuccess: async () => {
        setIsRoleModalOpen(false);
        setFormError("");
        await rolesQuery.refetch();
      },
      onError: (error) => {
        setFormError(error.message);
      },
    })
  );

  const updateRoleMutation = useMutation(
    trpc.role.update.mutationOptions({
      onSuccess: async () => {
        setIsRoleModalOpen(false);
        setFormError("");
        await rolesQuery.refetch();
      },
      onError: (error) => {
        setFormError(error.message);
      },
    })
  );

  const deleteRoleMutation = useMutation(
    trpc.role.delete.mutationOptions({
      onSuccess: async () => {
        setDeleteTarget(null);
        await rolesQuery.refetch();
      },
      onError: (error) => {
        setFormError(error.message);
      },
    })
  );

  const selectedPermissions = useMemo(() => {
    const selected = new Set(form.permissionIds);
    return (permissionOptionsQuery.data ?? []).filter((permission) =>
      selected.has(permission.id)
    );
  }, [form.permissionIds, permissionOptionsQuery.data]);

  const openCreateModal = () => {
    setModalMode("create");
    setEditingRoleId(null);
    setFormError("");
    setForm(EMPTY_FORM);
    setIsRoleModalOpen(true);
  };

  const openEditModal = (role: RoleItem) => {
    setModalMode("edit");
    setEditingRoleId(role.id);
    setFormError("");
    setForm({
      name: role.name,
      permissionIds: role.permissions.map((permission) => permission.id),
    });
    setIsRoleModalOpen(true);
  };

  const togglePermission = (permissionId: number) => {
    setForm((current) => {
      const exists = current.permissionIds.includes(permissionId);

      if (exists) {
        return {
          ...current,
          permissionIds: current.permissionIds.filter((id) => id !== permissionId),
        };
      }

      return {
        ...current,
        permissionIds: [...current.permissionIds, permissionId],
      };
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");

    if (!form.name.trim()) {
      setFormError("Informe o nome do cargo.");
      return;
    }

    if (modalMode === "create") {
      await createRoleMutation.mutateAsync({
        name: form.name,
        permissionIds: form.permissionIds,
      });
      return;
    }

    if (!editingRoleId) {
      setFormError("Cargo invalido para edicao.");
      return;
    }

    await updateRoleMutation.mutateAsync({
      id: editingRoleId,
      name: form.name,
      permissionIds: form.permissionIds,
    });
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  const isSaving = createRoleMutation.isPending || updateRoleMutation.isPending;

  useEffect(() => {
    if (meQuery.isLoading || !meQuery.data) {
      return;
    }

    if (!canManageUsers) {
      router.replace("/perfil");
    }
  }, [canManageUsers, meQuery.data, meQuery.isLoading, router]);

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
          grid-template-columns: 90px 1.2fr 2fr 0.8fr 0.8fr;
          align-items: center;
          gap: 8px;
        }
        @media (max-width: 1200px) {
          .table-grid { min-width: 1050px; }
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
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-white/20 shadow-lg ring-4 ring-white/15" />
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
              onClick={() => router.push("/home/users")}
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
              className={`shadow-nav flex w-full rounded-2xl bg-[#228d2e] py-3 ${
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
              <h1 className="text-[30px] font-bold text-[#1f1f1f]">Cargos e permissoes</h1>

              <button
                onClick={openCreateModal}
                disabled={permissionOptionsQuery.isLoading}
                className="shadow-soft rounded-2xl bg-[#37a93f] px-6 py-3 text-[18px] font-semibold text-white transition hover:bg-[#2f9737] disabled:cursor-not-allowed disabled:bg-[#9acfa0]"
              >
                Novo cargo
              </button>
            </div>

            {rolesQuery.isLoading ? (
              <div className="rounded-2xl bg-white p-8 text-center text-[#666] shadow-soft">
                Carregando cargos...
              </div>
            ) : rolesQuery.error ? (
              <div className="rounded-2xl bg-white p-8 text-center text-[#c73535] shadow-soft">
                {rolesQuery.error.message}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-full">
                  <div className="table-grid mb-2 rounded-xl bg-[#f6f6f6] px-6 py-4 text-[14px] font-semibold text-[#222] shadow-sm">
                    <div>ID</div>
                    <div>Cargo</div>
                    <div>Permissoes</div>
                    <div>Usuarios</div>
                    <div className="text-center">Opcoes</div>
                  </div>

                  <div className="shadow-soft divide-y divide-black/5 rounded-xl bg-white text-[13px] text-[#5b5b5b]">
                    {rolesQuery.data?.map((role) => (
                      <div key={role.id} className="table-grid px-6 py-5">
                        <div>{role.id}</div>
                        <div className="font-semibold text-[#1f1f1f]">{role.name}</div>
                        <div className="flex flex-wrap gap-1">
                          {role.permissions.length === 0 ? (
                            <span className="text-[#999]">Sem permissoes</span>
                          ) : (
                            role.permissions.map((permission) => (
                              <span
                                key={permission.id}
                                className="rounded-full bg-[#eef8ef] px-2 py-1 text-[11px] font-semibold text-[#246f2a]"
                              >
                                {permission.name}
                              </span>
                            ))
                          )}
                        </div>
                        <div>{role._count.users}</div>
                        <div className="flex items-center justify-center gap-4 text-[16px]">
                          <button
                            onClick={() => openEditModal(role)}
                            className="text-blue-600 transition hover:scale-110"
                            title="Editar"
                          >
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                              <path d="m3 17.25 9.81-9.81 2.75 2.75L5.75 20H3v-2.75Zm14.71-9.04a1.003 1.003 0 0 0 0-1.42l-1.5-1.5a1.003 1.003 0 0 0-1.42 0l-1.17 1.17 2.75 2.75 1.34-1Z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setDeleteTarget(role)}
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
            )}
          </div>
        </main>
      </div>

      {isRoleModalOpen && (
        <div
          onClick={() => setIsRoleModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8"
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="shadow-soft max-h-[92vh] w-full max-w-175 overflow-y-auto rounded-3xl bg-white p-10"
          >
            <h2 className="border-b border-black/20 pb-4 text-center text-[26px] font-bold text-[#1f1f1f]">
              {modalMode === "edit" ? "Editar cargo" : "Cadastrar cargo"}
            </h2>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="name" className="mb-1 block text-[15px] text-[#1f1f1f]">
                  Nome do cargo
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Ex.: Coordenador de curso"
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                  required
                  className="w-full rounded-full border border-black/30 px-5 py-2.5 text-[15px] text-[#333] outline-none transition focus:border-[#2ea03b]"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-[15px] text-[#1f1f1f]">Permissoes do cargo</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          permissionIds: (permissionOptionsQuery.data ?? []).map(
                            (permission) => permission.id
                          ),
                        }))
                      }
                      className="rounded-full border border-[#2ea03b] px-3 py-1 text-[12px] font-semibold text-[#2ea03b] transition hover:bg-[#eef8ef]"
                    >
                      Marcar todas
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          permissionIds: [],
                        }))
                      }
                      className="rounded-full border border-[#d92d2d] px-3 py-1 text-[12px] font-semibold text-[#d92d2d] transition hover:bg-[#fff1f1]"
                    >
                      Limpar
                    </button>
                  </div>
                </div>

                <div className="mb-3 flex min-h-11 flex-wrap gap-2 rounded-xl border border-black/20 bg-[#fafafa] p-3">
                  {selectedPermissions.length === 0 ? (
                    <p className="text-[13px] text-[#777]">Nenhuma permissao selecionada.</p>
                  ) : (
                    selectedPermissions.map((permission) => (
                      <button
                        key={permission.id}
                        type="button"
                        onClick={() => togglePermission(permission.id)}
                        className="rounded-full bg-[#2ea03b] px-3 py-1 text-[12px] font-semibold text-white"
                        title="Remover permissao"
                      >
                        {permission.name} x
                      </button>
                    ))
                  )}
                </div>

                <div className="max-h-52 space-y-2 overflow-y-auto rounded-xl border border-black/20 p-3">
                  {(permissionOptionsQuery.data ?? []).map((permission) => {
                    const isSelected = form.permissionIds.includes(permission.id);

                    return (
                      <button
                        key={permission.id}
                        type="button"
                        onClick={() => togglePermission(permission.id)}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[14px] transition ${
                          isSelected
                            ? "bg-[#e8f6ea] text-[#1f1f1f]"
                            : "bg-[#f7f7f7] text-[#444] hover:bg-[#ededed]"
                        }`}
                      >
                        <span>{permission.name}</span>
                        <span className="text-[12px] font-semibold">
                          {isSelected ? "Remover" : "Adicionar"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {formError && <p className="text-center text-[13px] text-[#d92d2d]">{formError}</p>}

              <div className="flex justify-center gap-6 pt-4">
                <button
                  type="button"
                  onClick={() => setIsRoleModalOpen(false)}
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
                Deseja excluir o cargo <span className="font-semibold">&quot;{deleteTarget.name}&quot;</span>?
              </p>
              <p className="mt-1 text-[13px] text-[#888]">
                Cargos com usuarios vinculados nao podem ser excluidos.
              </p>

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
                  onClick={() => deleteRoleMutation.mutate({ id: deleteTarget.id })}
                  disabled={deleteRoleMutation.isPending}
                  className="rounded-xl bg-[#d92d2d] px-8 py-2.5 text-[16px] font-semibold text-white transition hover:bg-[#bf2525] disabled:cursor-not-allowed disabled:bg-[#e4a3a3]"
                >
                  {deleteRoleMutation.isPending ? "Excluindo..." : "Sim"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
