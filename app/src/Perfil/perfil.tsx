"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Perfil() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const router = useRouter();

  const handleLogout = () => {
    router.push("/");
  };

  const goHome = () => {
    router.push("/home");
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
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-white/20 shadow-lg ring-4 ring-white/15">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80"
                  alt="Avatar"
                  className="h-full w-full object-cover"
                />
              </div>
              <div
                className={`min-w-0 overflow-hidden transition-all duration-200 ${
                  isSidebarOpen ? "max-w-[220px] opacity-100" : "max-w-0 opacity-0"
                }`}
              >
                <h2 className="text-[24px] font-semibold leading-none">Augusto</h2>
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
              onClick={goHome}
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
              onClick={goHome}
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
                <div className="h-32 w-32 overflow-hidden rounded-full bg-white ring-4 ring-[#2ea03b]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80"
                    alt="Foto do perfil"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>

              <h2 className="mb-6 text-center text-[26px] font-bold text-[#7a7a7a]">
                Administrador
              </h2>

              {/* Info card */}
              <div className="mb-4 rounded-xl border border-black/20 p-5">
                <p className="text-[14px] font-bold text-[#1f1f1f]">Nome</p>
                <p className="mb-3 text-[14px] text-[#5b5b5b]">
                  Augusto Oliveira Mendes
                </p>

                <p className="text-[14px] font-bold text-[#1f1f1f]">Email</p>
                <p className="mb-3 text-[14px] text-[#5b5b5b]">augusto.gmail.com</p>

                <p className="text-[14px] font-bold text-[#1f1f1f]">Número</p>
                <p className="text-[14px] text-[#5b5b5b]">(88) 91234-5678</p>
              </div>

              {/* Additional info */}
              <div className="rounded-xl border border-black/20 p-5">
                <p className="mb-2 text-[14px] font-bold text-[#1f1f1f]">
                  Informações Adicionais
                </p>
                <p className="text-[14px] text-[#5b5b5b]">Matrícula: 123456</p>
                <p className="text-[14px] text-[#5b5b5b]">
                  Área/Departamento: Matemática
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
