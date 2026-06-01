"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { canAccessSolicitacoes, MANAGE_USERS_PERMISSION } from "@/lib/permissions";
import { useTRPC } from "@/trpc/react";

type ProfileDraft = {
  name: string;
  phone: string;
  photoDataUrl: string | null;
};

const EMPTY_DRAFT: ProfileDraft = {
  name: "",
  phone: "",
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

export default function PerfilPage() {
  const router = useRouter();
  const trpc = useTRPC();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [draft, setDraft] = useState<ProfileDraft>(EMPTY_DRAFT);

  const meQuery = useQuery(trpc.user.me.queryOptions());

  const updateMeMutation = useMutation(
    trpc.user.updateMe.mutationOptions({
      onSuccess: async () => {
        setIsEditing(false);
        setErrorMessage("");
        await meQuery.refetch();
      },
      onError: (error) => {
        setErrorMessage(error.message);
      },
    })
  );

  const goInicio = () => router.push("/home");
  const goCadastros = () => router.push("/home/users");
  const canManageUsers =
    meQuery.data?.role.permissions.some(
      (permission) => permission.name === MANAGE_USERS_PERMISSION
    ) ?? false;
  const canAccessSolicitacao = canAccessSolicitacoes(meQuery.data?.role.name);

  const startEditing = () => {
    if (!meQuery.data) return;

    setDraft({
      name: meQuery.data.name,
      phone: meQuery.data.phone ?? "",
      photoDataUrl: meQuery.data.photoDataUrl,
    });
    setErrorMessage("");
    setIsEditing(true);
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  const saveEditing = async () => {
    await updateMeMutation.mutateAsync({
      name: draft.name,
      phone: draft.phone || null,
      photoDataUrl: draft.photoDataUrl,
    });
  };

  const cancelEditing = () => {
    if (!meQuery.data) {
      setIsEditing(false);
      return;
    }

    setDraft({
      name: meQuery.data.name,
      phone: meQuery.data.phone ?? "",
      photoDataUrl: meQuery.data.photoDataUrl,
    });
    setErrorMessage("");
    setIsEditing(false);
  };

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!ALLOWED_PHOTO_TYPES.has(file.type)) {
      setErrorMessage("Formato de imagem invalido. Use JPG, PNG, WEBP ou GIF.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      setErrorMessage("A imagem deve ter no maximo 512KB.");
      event.target.value = "";
      return;
    }

    try {
      const photoDataUrl = await fileToDataUrl(file);
      setDraft((current) => ({
        ...current,
        photoDataUrl,
      }));
      setErrorMessage("");
    } catch {
      setErrorMessage("Nao foi possivel processar a imagem selecionada.");
    }

    event.target.value = "";
  };

  const removeSelectedPhoto = () => {
    setDraft((current) => ({
      ...current,
      photoDataUrl: null,
    }));
  };

  if (meQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#efefef] font-[Poppins,sans-serif] text-[#555]">
        Carregando perfil...
      </div>
    );
  }

  if (!meQuery.data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#efefef] px-4 font-[Poppins,sans-serif]">
        <div className="w-full max-w-xl rounded-2xl bg-white p-8 text-center shadow-md">
          <p className="text-[#cc2c2c]">Não foi possível carregar o perfil.</p>
          <button
            type="button"
            onClick={() => meQuery.refetch()}
            className="mt-4 rounded-full bg-[#2ea03b] px-6 py-2 text-sm font-semibold text-white"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#efefef] font-[Poppins,sans-serif]">
      <style>{`
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
              onClick={goInicio}
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
                Início
              </span>
            </button>

            {canAccessSolicitacao && (
              <button
                type="button"
                onClick={() => router.push("/solicitacao")}
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
                  Solicitações
                </span>
              </button>
            )}

            {canManageUsers && (
              <button
                type="button"
                onClick={goCadastros}
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
                  Cadastros
                </span>
              </button>
            )}

            {canManageUsers && (
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
            )}

            {canManageUsers && (
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
            )}

            <button
              type="button"
              className={`shadow-nav flex w-full rounded-2xl bg-[#228d2e] py-3 ${
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

        <main className="relative flex-1 px-16 pb-16 pt-16">
          <div className="mx-auto flex max-w-4xl flex-col items-center pt-24">
            <div className="w-full max-w-145 rounded-3xl border-2 border-[#2ea03b] bg-white p-10 shadow-soft">
              <h2 className="mb-6 text-center text-[26px] font-bold text-[#1f1f1f]">Perfil</h2>

              <div className="mb-4 rounded-xl border border-black/20 p-5">
                <p className="text-[14px] font-bold text-[#1f1f1f]">Foto de perfil</p>
                <div className="mb-4 mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-black/20 bg-[#dfeee1] text-[22px] font-semibold text-[#2a6d2f]">
                    {(isEditing ? draft.photoDataUrl : meQuery.data.photoDataUrl) ? (
                      <Image
                        src={(isEditing ? draft.photoDataUrl : meQuery.data.photoDataUrl) ?? ""}
                        alt={`Foto de ${meQuery.data.name}`}
                        width={96}
                        height={96}
                        unoptimized
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span>{getInitials(meQuery.data.name)}</span>
                    )}
                  </div>

                  {isEditing && (
                    <div>
                      <div className="flex flex-wrap gap-3">
                        <label className="cursor-pointer rounded-xl bg-[#2ea03b] px-4 py-2 text-[14px] font-semibold text-white transition hover:bg-[#228d2e]">
                          Trocar foto
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
                          className="rounded-xl bg-[#a7a7a7] px-4 py-2 text-[14px] font-semibold text-white transition hover:bg-[#8b8b8b]"
                        >
                          Remover foto
                        </button>
                      </div>
                      <p className="mt-2 text-[12px] text-[#6f6f6f]">
                        Formatos aceitos: JPG, PNG, WEBP ou GIF. Tamanho maximo: 512KB.
                      </p>
                    </div>
                  )}
                </div>

                <p className="text-[14px] font-bold text-[#1f1f1f]">Nome</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={draft.name}
                    onChange={(e) => setDraft((current) => ({ ...current, name: e.target.value }))}
                    className="mb-3 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-[14px] text-[#1f1f1f] outline-none focus:border-[#2ea03b]"
                  />
                ) : (
                  <p className="mb-3 text-[14px] text-[#5b5b5b]">{meQuery.data.name}</p>
                )}

                <p className="text-[14px] font-bold text-[#1f1f1f]">Email</p>
                <p className="mb-3 text-[14px] text-[#5b5b5b]">{meQuery.data.email}</p>

                <p className="text-[14px] font-bold text-[#1f1f1f]">Telefone</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={draft.phone}
                    onChange={(e) => setDraft((current) => ({ ...current, phone: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-[14px] text-[#1f1f1f] outline-none focus:border-[#2ea03b]"
                  />
                ) : (
                  <p className="text-[14px] text-[#5b5b5b]">{meQuery.data.phone || "-"}</p>
                )}
              </div>

              <div className="rounded-xl border border-black/20 p-5">
                <p className="mb-2 text-[14px] font-bold text-[#1f1f1f]">Informações Adicionais</p>
                <p className="text-[14px] text-[#5b5b5b]">Cargo: {meQuery.data.role.name}</p>
                <p className="text-[14px] text-[#5b5b5b]">
                  Departamento: {meQuery.data.department.name}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {meQuery.data.role.permissions.map((permission) => (
                    <span
                      key={permission.id}
                      className="rounded-full bg-[#eef8ef] px-3 py-1 text-[12px] font-semibold text-[#246f2a]"
                    >
                      {permission.name}
                    </span>
                  ))}
                </div>
              </div>

              {errorMessage && <p className="mt-4 text-center text-[13px] text-[#d92d2d]">{errorMessage}</p>}

              <div className="mt-6 flex gap-3">
                {isEditing ? (
                  <>
                    <button
                      type="button"
                      onClick={cancelEditing}
                      className="flex-1 rounded-full border border-[#2ea03b] bg-white py-3 text-sm font-bold uppercase tracking-wider text-[#2ea03b] transition hover:bg-gray-100"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={saveEditing}
                      disabled={updateMeMutation.isPending}
                      className="flex-1 rounded-full bg-[#2ea03b] py-3 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-[#228d2e] disabled:cursor-not-allowed disabled:bg-[#95c899]"
                    >
                      {updateMeMutation.isPending ? "Salvando..." : "Salvar"}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={startEditing}
                    className="w-full rounded-full bg-[#2ea03b] py-3 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-[#228d2e]"
                  >
                    Editar Perfil
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
