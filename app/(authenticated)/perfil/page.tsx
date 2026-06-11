"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import Image from "next/image";

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
  const trpc = useTRPC();

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
  );
}
