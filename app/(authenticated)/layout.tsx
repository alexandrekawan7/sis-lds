"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";

import { canAccessSolicitacoes, hasPermission, MANAGE_USERS_PERMISSION } from "@/lib/permissions";
import { useTRPC } from "@/trpc/react";

function getInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (!parts.length) return "U";

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const trpc = useTRPC();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const meQuery = useQuery(trpc.user.me.queryOptions());

  const canManageUsers = hasPermission(
    meQuery.data?.role.permissions,
    MANAGE_USERS_PERMISSION
  );

  const canAccessSolicitacao =
    canAccessSolicitacoes(meQuery.data?.role.name) ||
    hasPermission(meQuery.data?.role.permissions, "Visualizar todas as solicitações de impressão") ||
    hasPermission(meQuery.data?.role.permissions, "Executar impressão de documentos");

  useEffect(() => {
    if (meQuery.isLoading) return;

    if (!meQuery.data) {
      router.replace("/");
    }
  }, [meQuery.data, meQuery.isLoading, router]);

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
          <p className="text-[#cc2c2c]">Não foi possível carregar a sessão.</p>
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
              onClick={() => router.push("/home")}
              className={`shadow-nav flex w-full rounded-2xl py-3 transition hover:bg-white/10 ${
                pathname === "/home" ? "bg-[#228d2e]" : ""
              } ${isSidebarOpen ? "items-center gap-4 px-3" : "justify-center px-0"}`}
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
                  pathname?.startsWith("/solicitacao") ? "bg-[#228d2e]" : ""
                } ${isSidebarOpen ? "items-center gap-4 px-3" : "justify-center px-0"}`}
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
                onClick={() => router.push("/home/users")}
                className={`shadow-nav flex w-full rounded-2xl py-3 transition hover:bg-white/10 ${
                  pathname?.startsWith("/home/users") ? "bg-[#228d2e]" : ""
                } ${isSidebarOpen ? "items-center gap-4 px-3" : "justify-center px-0"}`}
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
                  Usuários
                </span>
              </button>
            )}

            {canManageUsers && (
              <button
                type="button"
                onClick={() => router.push("/home/roles")}
                className={`shadow-nav flex w-full rounded-2xl py-3 transition hover:bg-white/10 ${
                  pathname?.startsWith("/home/roles") ? "bg-[#228d2e]" : ""
                } ${isSidebarOpen ? "items-center gap-4 px-3" : "justify-center px-0"}`}
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
                  pathname?.startsWith("/home/departments") ? "bg-[#228d2e]" : ""
                } ${isSidebarOpen ? "items-center gap-4 px-3" : "justify-center px-0"}`}
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
              onClick={() => router.push("/perfil")}
              className={`shadow-nav flex w-full rounded-2xl py-3 transition hover:bg-white/10 ${
                pathname?.startsWith("/perfil") ? "bg-[#228d2e]" : ""
              } ${isSidebarOpen ? "items-center gap-4 px-3" : "justify-center px-0"}`}
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
              onClick={() => signOut({ callbackUrl: "/" })}
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

        {children}
      </div>
    </div>
  );
}
