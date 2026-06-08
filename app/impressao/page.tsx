"use client";

import { Suspense, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import { canAccessImpressao } from "@/lib/permissions";
import { useTRPC } from "@/trpc/react";

const STATUS_FILTERS = [
  { value: "AGUARDANDO", label: "Em aberto" },
  { value: "CONCLUIDA", label: "Impressas" },
  { value: "REJEITADA", label: "Rejeitadas" },
  { value: "CANCELADA", label: "Arquivadas" },
];

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  AGUARDANDO: { label: "Aguardando...", className: "bg-[#e0892b] text-white" },
  APROVADA: { label: "Aprovada", className: "bg-[#3b62d8] text-white" },
  REJEITADA: { label: "Rejeitada", className: "bg-[#d92d2d] text-white" },
  CONCLUIDA: { label: "Imprimido", className: "bg-[#2ea03b] text-white" },
  CANCELADA: { label: "Arquivada", className: "bg-[#7a7a7a] text-white" },
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  if (!parts.length) return "U";
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

function formatData(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(value);
  if (!match) return value;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

function formatHorario(value: string) {
  const match = /^(\d{2}):(\d{2})$/u.exec(value);
  if (!match) return value;
  return `${match[1]}h${match[2]}`;
}

export default function ImpressaoPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#f5f5f5] font-[Poppins,sans-serif] text-[#555]">
        Carregando...
      </div>
    }>
      <ImpressaoPageContent />
    </Suspense>
  );
}

function ImpressaoPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const trpc = useTRPC();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const statusFilter = searchParams?.get("status") ?? "AGUARDANDO";

  const meQuery = useQuery(trpc.user.me.queryOptions());

  const isImpressor = canAccessImpressao(
    meQuery.data?.role.permissions.map((p) => p.name) ?? null
  );

  const solicitacoesQuery = useQuery({
    ...trpc.solicitacao.todas.queryOptions({ status: statusFilter || undefined }),
    enabled: isImpressor,
  });

  const desarquivarMutation = useMutation(
    trpc.solicitacao.desarquivar.mutationOptions({
      onSuccess: () => {
        void solicitacoesQuery.refetch();
      },
    })
  );

  const handleDesarquivar = (id: number) => {
    if (window.confirm("Deseja restaurar esta solicitação?")) {
      desarquivarMutation.mutate({ id });
    }
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  if (meQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f5f5] font-[Poppins,sans-serif] text-[#555]">
        Carregando...
      </div>
    );
  }

  if (!meQuery.data || !isImpressor) {
    router.replace("/perfil");
    return null;
  }

  const me = meQuery.data;
  const solicitacoes = solicitacoesQuery.data ?? [];

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f5f5f5] font-[Poppins,sans-serif]">
      <style>{`
        .shadow-soft { box-shadow: 0 10px 30px rgba(0,0,0,.08); }
        .shadow-nav { box-shadow: inset 0 1px 0 rgba(255,255,255,.08); }
      `}</style>

      <div className="flex min-h-screen">
        <aside
          className={`relative flex flex-col overflow-hidden bg-[#2ea043] py-8 text-white transition-all duration-300 ${
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
                {me.photoDataUrl ? (
                  <Image
                    src={me.photoDataUrl}
                    alt={`Foto de ${me.name}`}
                    width={64}
                    height={64}
                    unoptimized
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>{getInitials(me.name)}</span>
                )}
              </div>
              <div
                className={`min-w-0 overflow-hidden transition-all duration-200 ${
                  isSidebarOpen ? "max-w-55 opacity-100" : "max-w-0 opacity-0"
                }`}
              >
                <h2 className="text-[24px] font-semibold leading-none">
                  {me.name.split(" ")[0]}
                </h2>
                <p className="mt-1 text-[18px] leading-tight text-white/75">
                  {me.role.name}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsSidebarOpen((c) => !c)}
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/12 text-white transition hover:bg-white/20"
              aria-label={isSidebarOpen ? "Fechar sidebar" : "Abrir sidebar"}
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
                Início
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
                Impressões
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

        <main className="relative flex-1 px-16 pb-16 pt-12">
          <p className="text-[15px] text-[#7a7a7a]">Olá, {me.name.split(" ")[0]}!</p>

          <div className="mt-6 flex items-center justify-between">
            <h1 className="text-[26px] font-bold text-[#1f1f1f]">Solicitações</h1>

            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => router.push(`/impressao?status=${e.target.value}`)}
                className="appearance-none rounded-xl bg-[#3b62d8] px-5 py-2.5 pr-10 text-[15px] font-semibold text-white outline-none transition hover:bg-[#3354bd]"
              >
                {STATUS_FILTERS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
              <svg
                className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          </div>

          <div className="mt-8 space-y-6">
            {solicitacoesQuery.isLoading ? (
              <div className="rounded-2xl bg-white p-8 shadow-soft">
                <p className="text-[15px] font-semibold text-[#7a7a7a]">
                  Carregando solicitações...
                </p>
              </div>
            ) : solicitacoes.length === 0 && statusFilter === "CANCELADA" ? (
              <div className="flex flex-col items-center rounded-2xl bg-white px-8 py-16 shadow-soft">
                <svg
                  className="mb-4 h-16 w-16 text-[#b0b0b0]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
                <p className="text-[18px] font-bold text-[#1f1f1f]">
                  Nenhuma solicitação arquivada encontrada
                </p>
                <p className="mt-2 text-[14px] text-[#7a7a7a]">
                  Solicitações arquivadas aparecerão aqui.
                </p>
              </div>
            ) : solicitacoes.length === 0 ? (
              <div className="rounded-2xl bg-white p-8 shadow-soft">
                <p className="text-[15px] font-semibold text-[#1f1f1f]">
                  Nenhuma solicitação encontrada
                </p>
              </div>
            ) : (
              solicitacoes.map((solicitacao) => {
                const badge = STATUS_BADGE[solicitacao.status];
                const isArquivada = statusFilter === "CANCELADA";

                if (isArquivada) {
                  return (
                    <div
                      key={solicitacao.id}
                      className="rounded-2xl bg-white p-6 shadow-soft"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e9e9e9] text-[#555]">
                            <svg
                              className="h-7 w-7"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.6"
                            >
                              <path d="M7 3h8l4 4v14H5V3h2z" />
                              <path d="M15 3v5h5" />
                              <path d="M8 12h8M8 16h8" />
                            </svg>
                          </div>
                          <div>
                            <h2 className="text-[20px] font-bold text-[#1f1f1f]">
                              Solicitação #{solicitacao.id}
                            </h2>
                            <p className="mt-1 text-[14px] text-[#7a7a7a]">
                              Retiragem: {formatData(solicitacao.dataRetirada)} às{" "}
                              {formatHorario(solicitacao.horarioRetirada)}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDesarquivar(solicitacao.id)}
                          disabled={desarquivarMutation.isPending}
                          className="rounded-xl bg-[#5a5a5a] px-5 py-2.5 text-[14px] font-bold text-white transition hover:bg-[#444] disabled:opacity-60"
                        >
                          Desarquivar
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <Link
                    key={solicitacao.id}
                    href={`/impressao/${solicitacao.id}`}
                    className="block rounded-2xl bg-white p-6 shadow-soft transition hover:shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e9e9e9] text-[#555]">
                          <svg
                            className="h-7 w-7"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                          >
                            <path d="M7 3h8l4 4v14H5V3h2z" />
                            <path d="M15 3v5h5" />
                            <path d="M8 12h8M8 16h8" />
                          </svg>
                        </div>
                        <div>
                          <h2 className="text-[20px] font-bold text-[#1f1f1f]">
                            Solicitação #{solicitacao.id}
                          </h2>
                          <p className="mt-1 text-[14px] text-[#7a7a7a]">
                            Retiragem: {formatData(solicitacao.dataRetirada)} às{" "}
                            {formatHorario(solicitacao.horarioRetirada)}
                          </p>
                        </div>
                      </div>

                      {badge && (
                        <span
                          className={`rounded-full px-4 py-1.5 text-[13px] font-bold ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
