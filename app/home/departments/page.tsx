"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { MANAGE_USERS_PERMISSION } from "@/lib/permissions";
import { useTRPC } from "@/trpc/react";

type ModalMode = "create" | "edit";

type DepartmentItem = {
  id: number;
  name: string;
  _count: {
    users: number;
  };
};

type DepartmentFormState = {
  name: string;
};

const EMPTY_FORM: DepartmentFormState = {
  name: "",
};

function getInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (!parts.length) return "U";

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

export default function DepartmentsPage() {
  const router = useRouter();
  const trpc = useTRPC();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDepartmentModalOpen, setIsDepartmentModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [editingDepartmentId, setEditingDepartmentId] = useState<number | null>(null);
  const [formError, setFormError] = useState("");
  const [pageMessage, setPageMessage] = useState("");
  const [pageError, setPageError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<DepartmentItem | null>(null);
  const [form, setForm] = useState<DepartmentFormState>(EMPTY_FORM);

  const meQuery = useQuery(trpc.user.me.queryOptions());
  const canManageUsers =
    meQuery.data?.role.permissions.some(
      (permission) => permission.name === MANAGE_USERS_PERMISSION
    ) ?? false;

  const departmentsQuery = useQuery({
    ...trpc.user.departmentList.queryOptions(),
    enabled: canManageUsers,
  });

  const createDepartmentMutation = useMutation(
    trpc.user.departmentCreate.mutationOptions({
      onSuccess: async () => {
        setIsDepartmentModalOpen(false);
        setFormError("");
        setPageError("");
        setPageMessage("Departamento cadastrado com sucesso.");
        await departmentsQuery.refetch();
      },
      onError: (error) => {
        setPageMessage("");
        setFormError(error.message);
      },
    })
  );

  const updateDepartmentMutation = useMutation(
    trpc.user.departmentUpdate.mutationOptions({
      onSuccess: async () => {
        setIsDepartmentModalOpen(false);
        setFormError("");
        setPageError("");
        setPageMessage("Departamento atualizado com sucesso.");
        await departmentsQuery.refetch();
      },
      onError: (error) => {
        setPageMessage("");
        setFormError(error.message);
      },
    })
  );

  const deleteDepartmentMutation = useMutation(
    trpc.user.departmentDelete.mutationOptions({
      onSuccess: async () => {
        setDeleteTarget(null);
        setPageError("");
        setPageMessage("Departamento excluido com sucesso.");
        await departmentsQuery.refetch();
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
    setModalMode("create");
    setEditingDepartmentId(null);
    setFormError("");
    setForm(EMPTY_FORM);
    setIsDepartmentModalOpen(true);
  };

  const openEditModal = (department: DepartmentItem) => {
    setModalMode("edit");
    setEditingDepartmentId(department.id);
    setFormError("");
    setForm({ name: department.name });
    setIsDepartmentModalOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");

    if (!form.name.trim()) {
      setFormError("Informe o nome do departamento.");
      return;
    }

    if (modalMode === "create") {
      await createDepartmentMutation.mutateAsync({ name: form.name });
      return;
    }

    if (!editingDepartmentId) {
      setFormError("Departamento invalido para edicao.");
      return;
    }

    await updateDepartmentMutation.mutateAsync({
      id: editingDepartmentId,
      name: form.name,
    });
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  const isSaving = createDepartmentMutation.isPending || updateDepartmentMutation.isPending;
  const departmentItems = departmentsQuery.data ?? [];

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
        .department-grid {
          display: grid;
          grid-template-columns: 90px 1.5fr 1fr 0.8fr;
          align-items: center;
          gap: 8px;
        }
        @media (max-width: 1200px) {
          .department-grid { min-width: 720px; }
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
                {meQuery.data.photoDataUrl ? (
                  <Image
                    src={meQuery.data.photoDataUrl}
                    alt={`Foto de ${meQuery.data.name}`}
                    width={64}
                    height={64}
                    unoptimized
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>{getInitials(meQuery.data.name)}</span>
                )}
              </div>
              <div
                className={`min-w-0 overflow-hidden transition-all duration-200 ${
                  isSidebarOpen ? "max-w-55 opacity-100" : "max-w-0 opacity-0"
                }`}
              >
                <h2 className="text-[24px] font-semibold leading-none">
                  {meQuery.data.name.split(" ")[0]}
                </h2>
                <p className="mt-1 text-[18px] leading-tight text-white/75">
                  {meQuery.data.role.name}
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
          <div className="mx-auto max-w-300 pt-16">
            <div className="mb-8 flex items-center justify-between gap-4">
              <h1 className="text-[30px] font-bold text-[#1f1f1f]">Departamentos</h1>

              <button
                onClick={openCreateModal}
                className="shadow-soft rounded-2xl bg-[#226d9f] px-6 py-3 text-[16px] font-semibold text-white transition hover:bg-[#1b5b84]"
              >
                Novo departamento
              </button>
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

            {departmentsQuery.isLoading ? (
              <div className="rounded-2xl bg-white p-8 text-center text-[#666] shadow-soft">
                Carregando departamentos...
              </div>
            ) : departmentsQuery.error ? (
              <div className="rounded-2xl bg-white p-8 text-center text-[#c73535] shadow-soft">
                {departmentsQuery.error.message}
              </div>
            ) : departmentItems.length === 0 ? (
              <div className="rounded-2xl bg-white p-8 text-center text-[#666] shadow-soft">
                Nenhum departamento cadastrado.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-full">
                  <div className="department-grid mb-2 rounded-xl bg-[#f6f6f6] px-6 py-4 text-[14px] font-semibold text-[#222] shadow-sm">
                    <div>ID</div>
                    <div>Nome</div>
                    <div>Usuarios vinculados</div>
                    <div className="text-center">Opcoes</div>
                  </div>

                  <div className="shadow-soft divide-y divide-black/5 rounded-xl bg-white text-[13px] text-[#5b5b5b]">
                    {departmentItems.map((department) => (
                      <div key={department.id} className="department-grid px-6 py-5">
                        <div>{department.id}</div>
                        <div className="font-medium text-[#1f1f1f]">{department.name}</div>
                        <div>{department._count.users}</div>
                        <div className="flex items-center justify-center gap-4 text-[16px]">
                          <button
                            onClick={() => openEditModal(department)}
                            className="text-blue-600 transition hover:scale-110"
                            title="Editar"
                          >
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                              <path d="m3 17.25 9.81-9.81 2.75 2.75L5.75 20H3v-2.75Zm14.71-9.04a1.003 1.003 0 0 0 0-1.42l-1.5-1.5a1.003 1.003 0 0 0-1.42 0l-1.17 1.17 2.75 2.75 1.34-1Z" />
                            </svg>
                          </button>

                          <button
                            onClick={() => setDeleteTarget(department)}
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

      {isDepartmentModalOpen && (
        <div
          onClick={() => setIsDepartmentModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8"
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="shadow-soft w-full max-w-125 rounded-3xl bg-white p-8"
          >
            <h2 className="border-b border-black/20 pb-4 text-center text-[26px] font-bold text-[#1f1f1f]">
              {modalMode === "edit" ? "Editar departamento" : "Cadastrar departamento"}
            </h2>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="departmentName" className="mb-1 block text-[15px] text-[#1f1f1f]">
                  Nome do departamento
                </label>
                <input
                  id="departmentName"
                  name="departmentName"
                  type="text"
                  placeholder="Ex.: Laboratorio de Fisica"
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                  required
                  className="w-full rounded-full border border-black/30 px-5 py-2.5 text-[15px] text-[#333] outline-none transition focus:border-[#2ea03b]"
                />
              </div>

              {formError && <p className="text-center text-[13px] text-[#d92d2d]">{formError}</p>}

              <div className="flex justify-center gap-6 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDepartmentModalOpen(false)}
                  className="rounded-xl bg-[#d92d2d] px-8 py-2.5 text-[16px] font-semibold text-white transition hover:bg-[#bf2525]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-[#2ea03b] px-8 py-2.5 text-[16px] font-semibold text-white transition hover:bg-[#258a31] disabled:cursor-not-allowed disabled:bg-[#9acfa0]"
                >
                  {isSaving ? "Salvando..." : modalMode === "edit" ? "Salvar" : "Cadastrar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8">
          <div className="shadow-soft w-full max-w-120 rounded-3xl bg-white p-8">
            <h2 className="text-center text-[22px] font-bold text-[#1f1f1f]">Confirmar exclusao</h2>
            <p className="mt-4 text-center text-[15px] text-[#555]">
              Deseja excluir o departamento
              <span className="font-semibold"> {deleteTarget.name}</span>?
            </p>
            <p className="mt-2 text-center text-[13px] text-[#888]">
              Nao e possivel excluir departamentos com usuarios vinculados.
            </p>

            <div className="mt-6 flex justify-center gap-4">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl bg-[#9a9a9a] px-8 py-2.5 text-[16px] font-semibold text-white transition hover:bg-[#7a7a7a]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => deleteDepartmentMutation.mutate({ id: deleteTarget.id })}
                disabled={deleteDepartmentMutation.isPending}
                className="rounded-xl bg-[#d92d2d] px-8 py-2.5 text-[16px] font-semibold text-white transition hover:bg-[#bf2525] disabled:cursor-not-allowed disabled:bg-[#e4a3a3]"
              >
                {deleteDepartmentMutation.isPending ? "Excluindo..." : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
