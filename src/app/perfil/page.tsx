"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type ProfileData = {
  nome: string;
  email: string;
  numero: string;
  matricula: string;
  departamento: string;
};

type ImageTransform = {
  x: number;
  y: number;
  scale: number;
};

const DEFAULT_PROFILE: ProfileData = {
  nome: "Augusto Oliveira Mendes",
  email: "augusto.gmail.com",
  numero: "(88) 91234-5678",
  matricula: "123456",
  departamento: "Matemática",
};

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80";

const DEFAULT_TRANSFORM: ImageTransform = { x: 0, y: 0, scale: 1 };

export default function Perfil() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE);
  const [draft, setDraft] = useState<ProfileData>(DEFAULT_PROFILE);
  const [profileImage, setProfileImage] = useState<string>(DEFAULT_IMAGE);
  const [draftImage, setDraftImage] = useState<string>(DEFAULT_IMAGE);
  const [imageTransform, setImageTransform] =
    useState<ImageTransform>(DEFAULT_TRANSFORM);
  const [draftTransform, setDraftTransform] =
    useState<ImageTransform>(DEFAULT_TRANSFORM);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);
  const router = useRouter();

  const handleLogout = () => {
    router.push("/");
  };

  const goInicio = () => {
    router.push("/home");
  };

  const goCadastros = () => {
    router.push("/home/users");
  };

  const startEditing = () => {
    setDraft(profile);
    setDraftImage(profileImage);
    setDraftTransform(imageTransform);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setDraft(profile);
    setDraftImage(profileImage);
    setDraftTransform(imageTransform);
    setIsEditing(false);
  };

  const saveEditing = () => {
    setProfile(draft);
    setProfileImage(draftImage);
    setImageTransform(draftTransform);
    setIsEditing(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setDraftImage(reader.result);
        setDraftTransform(DEFAULT_TRANSFORM);
      }
    };
    reader.readAsDataURL(file);
  };

  const updateDraft = (field: keyof ProfileData, value: string) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isEditing) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: draftTransform.x,
      origY: draftTransform.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setDraftTransform((prev) => ({
      ...prev,
      x: dragRef.current!.origX + dx,
      y: dragRef.current!.origY + dy,
    }));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    dragRef.current = null;
  };

  const displayedImage = isEditing ? draftImage : profileImage;
  const displayedTransform = isEditing ? draftTransform : imageTransform;
  const transformStyle = {
    transform: `translate(calc(-50% + ${displayedTransform.x}px), calc(-50% + ${displayedTransform.y}px)) scale(${displayedTransform.scale})`,
  };
  const sidebarTransformStyle = {
    transform: `translate(calc(-50% + ${imageTransform.x * 0.25}px), calc(-50% + ${imageTransform.y * 0.25}px)) scale(${imageTransform.scale})`,
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#efefef] font-[Poppins,sans-serif]">
      <style>{`
        .shadow-soft { box-shadow: 0 10px 30px rgba(0,0,0,.08); }
        .shadow-nav { box-shadow: inset 0 1px 0 rgba(255,255,255,.08); }
      `}</style>

      <div className="flex min-h-screen">
        {/* Sidebar */}
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
            <div className={`flex items-center overflow-hidden transition-all duration-200 ${isSidebarOpen ? "gap-4" : "gap-0"}`}>
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-white/20 shadow-lg ring-4 ring-white/15">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={profileImage}
                  alt="Avatar"
                  draggable={false}
                  style={sidebarTransformStyle}
                  className="absolute left-1/2 top-1/2 h-full w-full max-w-none object-cover"
                />
              </div>
              <div
                className={`min-w-0 overflow-hidden transition-all duration-200 ${
                  isSidebarOpen ? "max-w-[220px] opacity-100" : "max-w-0 opacity-0"
                }`}
              >
                <h2 className="text-[24px] font-semibold leading-none">
                  {profile.nome.split(" ")[0]}
                </h2>
                <p className="mt-1 text-[22px] leading-tight text-white/75">Administrador</p>
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
                  isSidebarOpen ? "max-w-[160px] opacity-100" : "max-w-0 opacity-0"
                }`}
              >
                Início
              </span>
            </button>

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
                  isSidebarOpen ? "max-w-[160px] opacity-100" : "max-w-0 opacity-0"
                }`}
              >
                Cadastros
              </span>
            </button>

            <a
              href="#"
              className={`shadow-nav flex rounded-2xl bg-[#228d2e] py-3 ${
                isSidebarOpen ? "items-center gap-4 px-3" : "justify-center px-0"
              }`}
            >
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.33 0-8 2.17-8 5v1h16v-1c0-2.83-3.67-5-8-5Z" />
              </svg>
              <span
                className={`overflow-hidden whitespace-nowrap text-[17px] transition-all duration-200 ${
                  isSidebarOpen ? "max-w-[160px] opacity-100" : "max-w-0 opacity-0"
                }`}
              >
                Perfil
              </span>
            </a>

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
                  isSidebarOpen ? "max-w-[160px] opacity-100" : "max-w-0 opacity-0"
                }`}
              >
                Sair
              </span>
            </button>
          </nav>
        </aside>

        {/* Main */}
        <main className="relative flex-1 px-16 pb-16 pt-16">
          <div className="mx-auto flex max-w-4xl flex-col items-center pt-24">
            <div className="relative w-full max-w-[520px] rounded-3xl border-2 border-[#2ea03b] bg-white px-10 pb-10 pt-20">
              {/* Avatar overlapping card */}
              <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
                <div className="relative">
                  <div
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    className={`relative h-32 w-32 overflow-hidden rounded-full bg-white ring-4 ring-[#2ea03b] ${
                      isEditing ? "cursor-grab active:cursor-grabbing" : ""
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={displayedImage}
                      alt="Foto do perfil"
                      draggable={false}
                      style={transformStyle}
                      className="absolute left-1/2 top-1/2 h-full w-full max-w-none select-none object-cover"
                    />
                  </div>

                  {/* Botão de lápis (editar) */}
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={startEditing}
                      aria-label="Editar perfil"
                      title="Editar perfil"
                      className="absolute bottom-1 right-1 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#2ea03b] text-white shadow-md ring-2 ring-white transition hover:bg-[#228d2e]"
                    >
                      <svg
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                      </svg>
                    </button>
                  )}

                  {/* Botão de câmera (trocar imagem) - aparece em modo edição */}
                  {isEditing && (
                    <>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        aria-label="Trocar foto de perfil"
                        title="Trocar foto de perfil"
                        className="absolute bottom-1 right-1 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#2ea03b] text-white shadow-md ring-2 ring-white transition hover:bg-[#228d2e]"
                      >
                        <svg
                          className="h-5 w-5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                          <circle cx="12" cy="13" r="4" />
                        </svg>
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </>
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="mb-6 flex flex-col items-center gap-2">
                  <p className="text-[12px] text-[#5b5b5b]">
                    Arraste a foto para reposicionar
                  </p>
                  <div className="flex w-full max-w-70 items-center gap-3">
                    <span className="text-[12px] font-bold text-[#1f1f1f]">
                      Zoom
                    </span>
                    <input
                      type="range"
                      min={0.5}
                      max={3}
                      step={0.01}
                      value={draftTransform.scale}
                      onChange={(e) =>
                        setDraftTransform((prev) => ({
                          ...prev,
                          scale: Number(e.target.value),
                        }))
                      }
                      className="flex-1 accent-[#2ea03b]"
                    />
                    <button
                      type="button"
                      onClick={() => setDraftTransform(DEFAULT_TRANSFORM)}
                      className="rounded-full border border-[#2ea03b] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#2ea03b] transition hover:bg-[#2ea03b]/10"
                    >
                      Resetar
                    </button>
                  </div>
                </div>
              )}

              <h2 className="mb-6 text-center text-[26px] font-bold text-[#7a7a7a]">
                Administrador
              </h2>

              {/* Info card */}
              <div className="mb-4 rounded-xl border border-black/20 p-5">
                <p className="text-[14px] font-bold text-[#1f1f1f]">Nome</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={draft.nome}
                    onChange={(e) => updateDraft("nome", e.target.value)}
                    className="mb-3 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-[14px] text-[#1f1f1f] outline-none focus:border-[#2ea03b] focus:ring-1 focus:ring-[#2ea03b]"
                  />
                ) : (
                  <p className="mb-3 text-[14px] text-[#5b5b5b]">
                    {profile.nome}
                  </p>
                )}

                <p className="text-[14px] font-bold text-[#1f1f1f]">Email</p>
                {isEditing ? (
                  <input
                    type="email"
                    value={draft.email}
                    onChange={(e) => updateDraft("email", e.target.value)}
                    className="mb-3 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-[14px] text-[#1f1f1f] outline-none focus:border-[#2ea03b] focus:ring-1 focus:ring-[#2ea03b]"
                  />
                ) : (
                  <p className="mb-3 text-[14px] text-[#5b5b5b]">{profile.email}</p>
                )}

                <p className="text-[14px] font-bold text-[#1f1f1f]">Número</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={draft.numero}
                    onChange={(e) => updateDraft("numero", e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-[14px] text-[#1f1f1f] outline-none focus:border-[#2ea03b] focus:ring-1 focus:ring-[#2ea03b]"
                  />
                ) : (
                  <p className="text-[14px] text-[#5b5b5b]">{profile.numero}</p>
                )}
              </div>

              {/* Additional info */}
              <div className="rounded-xl border border-black/20 p-5">
                <p className="mb-2 text-[14px] font-bold text-[#1f1f1f]">
                  Informações Adicionais
                </p>

                {isEditing ? (
                  <>
                    <label className="text-[13px] text-[#5b5b5b]">Matrícula</label>
                    <input
                      type="text"
                      value={draft.matricula}
                      onChange={(e) => updateDraft("matricula", e.target.value)}
                      className="mb-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-[14px] text-[#1f1f1f] outline-none focus:border-[#2ea03b] focus:ring-1 focus:ring-[#2ea03b]"
                    />
                    <label className="text-[13px] text-[#5b5b5b]">
                      Área/Departamento
                    </label>
                    <input
                      type="text"
                      value={draft.departamento}
                      onChange={(e) => updateDraft("departamento", e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-[14px] text-[#1f1f1f] outline-none focus:border-[#2ea03b] focus:ring-1 focus:ring-[#2ea03b]"
                    />
                  </>
                ) : (
                  <>
                    <p className="text-[14px] text-[#5b5b5b]">
                      Matrícula: {profile.matricula}
                    </p>
                    <p className="text-[14px] text-[#5b5b5b]">
                      Área/Departamento: {profile.departamento}
                    </p>
                  </>
                )}
              </div>

              {/* Botões de ação em modo de edição */}
              {isEditing && (
                <div className="mt-6 flex gap-3">
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
                    className="flex-1 rounded-full bg-[#2ea03b] py-3 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-[#228d2e]"
                  >
                    Salvar
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
