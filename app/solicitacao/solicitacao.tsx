"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { canAccessSolicitacoes } from "@/lib/permissions";
import { useTRPC } from "@/trpc/react";

import NovaSolicitacao, { type SolicitacaoFormValues } from "./nova-solicitacao";

type SolicitacaoItem = {
  id: number;
  tipoPapel: string;
  intuito: string;
  copias: number;
  tamanho: string;
  orientacao: string;
  modelo: string;
  cor: string;
  acabamento: string;
  documento: string | null;
  dataRetirada: string;
  horarioRetirada: string;
  status: "AGUARDANDO" | "APROVADA" | "REJEITADA" | "CONCLUIDA" | "CANCELADA";
  solicitante: { nome: string; cargo: string; departamento: string };
};

const STATUS_LABELS: Record<SolicitacaoItem["status"], { label: string; className: string }> = {
  AGUARDANDO: { label: "Aguardando...", className: "text-[#e0892b]" },
  APROVADA: { label: "Aprovada", className: "text-[#3b62d8]" },
  REJEITADA: { label: "Rejeitada", className: "text-[#d92d2d]" },
  CONCLUIDA: { label: "Concluída", className: "text-[#2ea03b]" },
  CANCELADA: { label: "Cancelada", className: "text-[#7a7a7a]" },
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

function toFormValues(solicitacao: SolicitacaoItem): SolicitacaoFormValues {
  return {
    tipoPapel: solicitacao.tipoPapel,
    intuito: solicitacao.intuito,
    copias: solicitacao.copias,
    tamanho: solicitacao.tamanho,
    orientacao: solicitacao.orientacao,
    modelo: solicitacao.modelo,
    cor: solicitacao.cor,
    acabamento: solicitacao.acabamento,
    documento: solicitacao.documento,
    dataRetirada: solicitacao.dataRetirada,
    horarioRetirada: solicitacao.horarioRetirada,
  };
}

export default function Solicitacao() {
  const router = useRouter();
  const trpc = useTRPC();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [view, setView] = useState<"list" | "form">("list");
  const [editing, setEditing] = useState<SolicitacaoItem | null>(null);

  const meQuery = useQuery(trpc.user.me.queryOptions());

  const canAccess = canAccessSolicitacoes(meQuery.data?.role.name);

  const solicitacoesQuery = useQuery({
    ...trpc.solicitacao.minhas.queryOptions(),
    enabled: canAccess,
  });

  const cancelarMutation = useMutation(
    trpc.solicitacao.cancelar.mutationOptions({
      onSuccess: () => {
        void solicitacoesQuery.refetch();
      },
    })
  );

  const openCreate = () => {
    setEditing(null);
    setView("form");
  };

  const openEdit = (solicitacao: SolicitacaoItem) => {
    setEditing(solicitacao);
    setView("form");
  };

  const handleCancelar = (id: number) => {
    if (window.confirm("Deseja realmente cancelar esta solicitação?")) {
      cancelarMutation.mutate({ id });
    }
  };

  // Protege a rota: quem não é Professor/Convidado/Coordenador volta ao perfil.
  useEffect(() => {
    if (meQuery.isLoading) return;

    if (!meQuery.data) {
      router.replace("/");
      return;
    }

    if (!canAccess) {
      router.replace("/perfil");
    }
  }, [canAccess, meQuery.data, meQuery.isLoading, router]);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  if (meQuery.isLoading || !meQuery.data || !canAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#efefef] font-[Poppins,sans-serif] text-[#555]">
        Carregando...
      </div>
    );
  }

  const me = meQuery.data;
  const solicitacoes = solicitacoesQuery.data ?? [];

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
                Solicitações
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

          {view === "form" ? (
            <div className="mt-6">
              <NovaSolicitacao
                solicitacaoId={editing?.id}
                initialValues={editing ? toFormValues(editing) : undefined}
                onCancel={() => setView("list")}
                onCreated={() => {
                  setView("list");
                  setEditing(null);
                  void solicitacoesQuery.refetch();
                }}
              />
            </div>
          ) : (
            <>
              <h1 className="mt-6 text-[26px] font-bold text-[#1f1f1f]">Minhas Solicitações</h1>

              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={openCreate}
                  className="w-full max-w-145 rounded-full bg-[#2ea03b] py-4 text-[18px] font-bold text-white transition hover:bg-[#228d2e]"
                >
                  Solicitar Impressão
                </button>
              </div>

              <div className="mt-10 space-y-6">
                {solicitacoesQuery.isLoading ? (
                  <div className="rounded-2xl border border-black/15 bg-white p-8 shadow-soft">
                    <p className="text-[15px] font-semibold text-[#7a7a7a]">Carregando solicitações...</p>
                  </div>
                ) : solicitacoes.length === 0 ? (
                  <div className="rounded-2xl border border-black/15 bg-white p-8 shadow-soft">
                    <p className="text-[15px] font-semibold text-[#1f1f1f]">Sem solicitações ativas</p>
                  </div>
                ) : (
                  solicitacoes.map((solicitacao) => {
                    const status = STATUS_LABELS[solicitacao.status];
                    const podeEditar = solicitacao.status === "AGUARDANDO";

                    return (
                      <div
                        key={solicitacao.id}
                        className="rounded-2xl border border-black/15 bg-white p-8 shadow-soft"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e9e9e9] text-[#555]">
                              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                                <path d="M7 3h8l4 4v14H5V3h2z" />
                                <path d="M15 3v5h5" />
                                <path d="M8 12h8M8 16h8" />
                              </svg>
                            </div>
                            <h2 className="text-[20px] font-extrabold text-[#1f1f1f]">
                              Solicitação #{solicitacao.id}
                            </h2>
                          </div>

                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={() => handleCancelar(solicitacao.id)}
                              disabled={cancelarMutation.isPending}
                              className="rounded-xl bg-[#d92d2d] px-5 py-2 text-[15px] font-bold text-white transition hover:bg-[#bd2626] disabled:opacity-60"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={() => openEdit(solicitacao)}
                              disabled={!podeEditar}
                              title={podeEditar ? undefined : "Só é possível editar enquanto aguarda aprovação"}
                              className="rounded-xl bg-[#3b62d8] px-5 py-2 text-[15px] font-bold text-white transition hover:bg-[#3354bd] disabled:opacity-50"
                            >
                              Editar
                            </button>
                          </div>
                        </div>

                        <div className="mt-6 grid gap-8 sm:grid-cols-2">
                          <div className="space-y-5 text-[15px] text-[#3a3a3a]">
                            <div>
                              <h3 className="text-[16px] font-extrabold text-[#1f1f1f]">Solicitante</h3>
                              <p>Nome: {solicitacao.solicitante.nome}</p>
                              <p>Cargo: {solicitacao.solicitante.cargo}</p>
                              <p>Departamento/Área: {solicitacao.solicitante.departamento}</p>
                            </div>
                            <div>
                              <h3 className="text-[16px] font-extrabold text-[#1f1f1f]">Sobre o Material</h3>
                              <p>Tipo de papel: {solicitacao.tipoPapel}</p>
                              <p>Intuito: {solicitacao.intuito}</p>
                              <p>Quantidade de cópias: {solicitacao.copias}</p>
                            </div>
                            <div>
                              <h3 className="text-[16px] font-extrabold text-[#1f1f1f]">Configurações da Impressão</h3>
                              <p>Tamanho: {solicitacao.tamanho}</p>
                              <p>Orientação: {solicitacao.orientacao}</p>
                              <p>Modelo: {solicitacao.modelo}</p>
                              <p>Cor: {solicitacao.cor}</p>
                            </div>
                          </div>

                          <div className="space-y-5 text-[15px] text-[#3a3a3a]">
                            <div>
                              <h3 className="text-[16px] font-extrabold text-[#1f1f1f]">Acabamento e Anexagem</h3>
                              <p>Acabamento: {solicitacao.acabamento}</p>
                              <p>
                                Anexo:{" "}
                                {solicitacao.documento ? (
                                  <span className="text-[#2563c9] underline">{solicitacao.documento}</span>
                                ) : (
                                  "nenhum"
                                )}
                              </p>
                            </div>
                            <div>
                              <h3 className="text-[16px] font-extrabold text-[#1f1f1f]">Retirada</h3>
                              <p>Data: {formatData(solicitacao.dataRetirada)}</p>
                              <p>Horário: {formatHorario(solicitacao.horarioRetirada)}</p>
                            </div>
                            <p className="text-[16px] font-extrabold text-[#1f1f1f]">
                              Status: <span className={`font-extrabold ${status.className}`}>{status.label}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
