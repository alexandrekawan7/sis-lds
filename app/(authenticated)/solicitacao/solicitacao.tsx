"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { canAccessSolicitacoes, hasPermission } from "@/lib/permissions";
import { useTRPC } from "@/trpc/react";

import NovaSolicitacao, { type SolicitacaoFormValues } from "./nova-solicitacao";

type SolicitacaoItem = {
  id: number;
  solicitanteId: number;
  tipoPapel: string;
  intuito: string;
  copias: number;
  tamanho: string;
  orientacao: string;
  modelo: string;
  cor: string;
  acabamento: string;
  documento: string | null;
  documentId: string | null;
  dataRetirada: string;
  horarioRetirada: string;
  status: "AGUARDANDO" | "APROVADA" | "REJEITADA" | "IMPRIMINDO" | "IMPRESSA" | "CANCELADA";
  solicitante: { nome: string; cargo: string; departamento: string };
};

const STATUS_LABELS: Record<SolicitacaoItem["status"], { label: string; className: string }> = {
  AGUARDANDO: { label: "Aguardando...", className: "text-[#e0892b]" },
  APROVADA: { label: "Aprovada", className: "text-[#3b62d8]" },
  REJEITADA: { label: "Rejeitada", className: "text-[#d92d2d]" },
  IMPRIMINDO: { label: "Imprimindo", className: "text-[#8a2be2]" },
  IMPRESSA: { label: "Impressa", className: "text-[#2ea03b]" },
  CANCELADA: { label: "Cancelada", className: "text-[#7a7a7a]" },
};



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
    documentId: solicitacao.documentId,
    dataRetirada: solicitacao.dataRetirada,
    horarioRetirada: solicitacao.horarioRetirada,
  };
}

export default function Solicitacao() {
  const router = useRouter();
  const trpc = useTRPC();

  const [view, setView] = useState<"list" | "form">("list");
  const [editing, setEditing] = useState<SolicitacaoItem | null>(null);

  const meQuery = useQuery(trpc.user.me.queryOptions());

  const hasVisTodas = hasPermission(meQuery.data?.role.permissions, "Visualizar todas as solicitações de impressão");
  const hasCriar = hasPermission(meQuery.data?.role.permissions, "Criar solicitações de impressão");
  const hasAprovar = hasPermission(meQuery.data?.role.permissions, "Aprovar solicitações de impressão");
  const hasRejeitar = hasPermission(meQuery.data?.role.permissions, "Rejeitar solicitações de impressão");
  const hasImprimir = hasPermission(meQuery.data?.role.permissions, "Executar impressão de documentos");

  const canSeeAll = hasVisTodas || hasImprimir;
  const canAccess = canAccessSolicitacoes(meQuery.data?.role.name) || canSeeAll;

  const minhasQuery = useQuery({
    ...trpc.solicitacao.minhas.queryOptions(),
    enabled: canAccess && !canSeeAll && !!meQuery.data,
  });

  const todasQuery = useQuery({
    ...trpc.solicitacao.todas.queryOptions(),
    enabled: canAccess && canSeeAll && !!meQuery.data,
  });

  const solicitacoes = (canSeeAll ? todasQuery.data : minhasQuery.data) ?? [];
  const isLoadingSolicitacoes = minhasQuery.isLoading || todasQuery.isLoading;

  const refetch = () => {
    if (canSeeAll) {
      void todasQuery.refetch();
    } else {
      void minhasQuery.refetch();
    }
  };

  const cancelarMutation = useMutation(
    trpc.solicitacao.cancelar.mutationOptions({
      onSuccess: () => refetch(),
    })
  );

  const aprovarMutation = useMutation(
    trpc.solicitacao.aprovar.mutationOptions({
      onSuccess: () => refetch(),
    })
  );

  const rejeitarMutation = useMutation(
    trpc.solicitacao.rejeitar.mutationOptions({
      onSuccess: () => refetch(),
    })
  );

  const iniciarImpressaoMutation = useMutation(
    trpc.solicitacao.iniciarImpressao.mutationOptions({
      onSuccess: () => refetch(),
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

  const handleAprovar = (id: number) => {
    if (window.confirm("Deseja realmente aprovar esta solicitação?")) {
      aprovarMutation.mutate({ id });
    }
  };

  const handleRejeitar = (id: number) => {
    if (window.confirm("Deseja realmente rejeitar esta solicitação?")) {
      rejeitarMutation.mutate({ id });
    }
  };

  const handleIniciarImpressao = async (id: number) => {
    if (window.confirm("Deseja iniciar a impressão desta solicitação?")) {
      await iniciarImpressaoMutation.mutateAsync({ id });
      router.push(`/solicitacao/${id}/imprimir`);
    }
  };

  const handleContinuarImpressao = (id: number) => {
    router.push(`/solicitacao/${id}/imprimir`);
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



  if (meQuery.isLoading || !meQuery.data || !canAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#efefef] font-[Poppins,sans-serif] text-[#555]">
        Carregando...
      </div>
    );
  }

  const me = meQuery.data;

  return (
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
                  refetch();
                }}
              />
            </div>
          ) : (
            <>
              <h1 className="mt-6 text-[26px] font-bold text-[#1f1f1f]">
                {canSeeAll ? "Todas as Solicitações" : "Minhas Solicitações"}
              </h1>

              {hasCriar && (
                <div className="mt-8 flex justify-center">
                  <button
                    type="button"
                    onClick={openCreate}
                    className="w-full max-w-145 rounded-full bg-[#2ea03b] py-4 text-[18px] font-bold text-white transition hover:bg-[#228d2e]"
                  >
                    Solicitar Impressão
                  </button>
                </div>
              )}

              <div className="mt-10 space-y-6">
                {isLoadingSolicitacoes ? (
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
                    const isOwner = solicitacao.solicitanteId === Number(me?.id);
                    const podeEditar = isOwner && solicitacao.status === "AGUARDANDO";
                    const podeCancelar = isOwner && solicitacao.status === "AGUARDANDO";
 
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
                            {isOwner && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleCancelar(solicitacao.id)}
                                  disabled={!podeCancelar || cancelarMutation.isPending}
                                  title={podeCancelar ? undefined : "Só é possível cancelar solicitações aguardando aprovação"}
                                  className="rounded-xl bg-[#d92d2d] px-5 py-2 text-[15px] font-bold text-white transition hover:bg-[#bd2626] disabled:opacity-50"
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
                              </>
                            )}
                            {hasAprovar && solicitacao.status === "AGUARDANDO" && (
                              <button
                                type="button"
                                onClick={() => handleAprovar(solicitacao.id)}
                                disabled={aprovarMutation.isPending}
                                className="rounded-xl bg-[#2ea03b] px-5 py-2 text-[15px] font-bold text-white transition hover:bg-[#228d2e] disabled:opacity-50"
                              >
                                Aprovar
                              </button>
                            )}
                            {hasRejeitar && solicitacao.status === "AGUARDANDO" && (
                              <button
                                type="button"
                                onClick={() => handleRejeitar(solicitacao.id)}
                                disabled={rejeitarMutation.isPending}
                                className="rounded-xl bg-[#d92d2d] px-5 py-2 text-[15px] font-bold text-white transition hover:bg-[#bd2626] disabled:opacity-50"
                              >
                                Rejeitar
                              </button>
                            )}
                            {hasImprimir && solicitacao.status === "APROVADA" && (
                              <button
                                type="button"
                                onClick={() => handleIniciarImpressao(solicitacao.id)}
                                disabled={iniciarImpressaoMutation.isPending}
                                className="rounded-xl bg-[#8a2be2] px-5 py-2 text-[15px] font-bold text-white transition hover:bg-[#7825c4] disabled:opacity-50"
                              >
                                Iniciar impressão
                              </button>
                            )}
                            {hasImprimir && solicitacao.status === "IMPRIMINDO" && (
                              <button
                                type="button"
                                onClick={() => handleContinuarImpressao(solicitacao.id)}
                                className="rounded-xl bg-[#8a2be2] px-5 py-2 text-[15px] font-bold text-white transition hover:bg-[#7825c4]"
                              >
                                Continuar impressão
                              </button>
                            )}
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
  );
}
