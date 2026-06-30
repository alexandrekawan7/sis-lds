"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { hasPermission } from "@/lib/permissions";
import { useTRPC } from "@/trpc/react";

const REPORTS = [
  { key: "geral", label: "1.1 Geral" },
  { key: "periodo", label: "1.2 Por Período" },
  { key: "solicitante", label: "1.3 Por Solicitante" },
  { key: "departamento", label: "1.4 Por Departamento" },
  { key: "aprovacoes", label: "1.5 Aprovações" },
  { key: "producao", label: "1.6 Produção" },
  { key: "recursos", label: "1.7 Recursos" },
] as const;

type ReportKey = (typeof REPORTS)[number]["key"];

const STATUS_LABEL: Record<string, string> = {
  AGUARDANDO: "Aguardando",
  APROVADA: "Aprovada",
  REJEITADA: "Rejeitada",
  IMPRIMINDO: "Imprimindo",
  IMPRESSA: "Impressa",
  CANCELADA: "Cancelada",
};

function fmtData(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR");
}

function fmtDataHora(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function fmtDataRetirada(value: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(value);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : value;
}

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const escape = (v: string | number) => {
    const s = String(v ?? "");
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = rows.map((r) => r.map(escape).join(";")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="border-b border-black/10 px-3 py-2 text-left text-[13px] font-extrabold text-[#1f1f1f]">
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="border-b border-black/5 px-3 py-2 text-[13px] text-[#3a3a3a]">{children}</td>;
}

function Card({ title, value, hint }: { title: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-soft">
      <p className="text-[13px] font-semibold text-[#7a7a7a]">{title}</p>
      <p className="mt-1 text-[28px] font-extrabold text-[#1f1f1f]">{value}</p>
      {hint && <p className="text-[12px] text-[#9a9a9a]">{hint}</p>}
    </div>
  );
}

function ExportButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl bg-[#2ea03b] px-4 py-2 text-[14px] font-bold text-white transition hover:bg-[#228d2e]"
    >
      Exportar CSV
    </button>
  );
}

export default function RelatoriosPage() {
  const router = useRouter();
  const trpc = useTRPC();

  const [tab, setTab] = useState<ReportKey>("geral");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");

  const meQuery = useQuery(trpc.user.me.queryOptions());
  const canView = hasPermission(meQuery.data?.role.permissions, "Visualizar e exportar relatórios de folhas");

  const reportQuery = useQuery({
    ...trpc.relatorio.completo.queryOptions({
      inicio: inicio || undefined,
      fim: fim || undefined,
    }),
    enabled: !!meQuery.data && canView,
  });

  useEffect(() => {
    if (meQuery.isLoading) return;
    if (!meQuery.data) {
      router.replace("/");
      return;
    }
    if (!canView) router.replace("/perfil");
  }, [canView, meQuery.data, meQuery.isLoading, router]);

  const data = reportQuery.data;

  const periodoLabel = useMemo(() => {
    if (!inicio && !fim) return "Todo o período";
    return `${inicio ? fmtDataRetirada(inicio) : "início"} até ${fim ? fmtDataRetirada(fim) : "hoje"}`;
  }, [inicio, fim]);

  if (meQuery.isLoading || !meQuery.data || !canView) {
    return (
      <main className="flex-1 p-8 md:p-16">
        <p className="text-[15px] font-semibold text-[#7a7a7a]">Carregando...</p>
      </main>
    );
  }

  return (
    <main className="flex-1 px-8 pb-16 pt-12 md:px-16">
      <h1 className="text-[26px] font-bold text-[#1f1f1f]">Relatórios</h1>
      <p className="mt-1 text-[15px] text-[#7a7a7a]">{periodoLabel}</p>

      {/* Filtro de período */}
      <div className="mt-6 flex flex-wrap items-end gap-4 rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
        <label className="block">
          <span className="mb-1 block text-[13px] font-semibold text-[#3a3a3a]">Início</span>
          <input
            type="date"
            value={inicio}
            onChange={(e) => setInicio(e.target.value)}
            className="rounded-lg border border-black/30 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#2ea03b]"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[13px] font-semibold text-[#3a3a3a]">Fim</span>
          <input
            type="date"
            value={fim}
            onChange={(e) => setFim(e.target.value)}
            className="rounded-lg border border-black/30 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#2ea03b]"
          />
        </label>
        <button
          type="button"
          onClick={() => {
            setInicio("");
            setFim("");
          }}
          className="rounded-lg px-3 py-2 text-sm font-semibold text-[#555] transition hover:bg-gray-100"
        >
          Limpar
        </button>
      </div>

      {/* Abas */}
      <div className="mt-6 flex flex-wrap gap-2">
        {REPORTS.map((r) => (
          <button
            key={r.key}
            type="button"
            onClick={() => setTab(r.key)}
            className={`rounded-full px-4 py-2 text-[14px] font-bold transition ${
              tab === r.key ? "bg-[#2ea03b] text-white" : "bg-white text-[#3a3a3a] ring-1 ring-black/10 hover:bg-gray-50"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {reportQuery.isLoading || !data ? (
          <div className="rounded-2xl border border-black/10 bg-white p-8 shadow-soft">
            <p className="text-[15px] font-semibold text-[#7a7a7a]">Carregando relatório...</p>
          </div>
        ) : (
          <>
            {tab === "geral" && (
              <Section
                title="1.1 Relatório Geral de Solicitações"
                onExport={() =>
                  downloadCsv("relatorio-geral.csv", [
                    [
                      "Nº",
                      "Data",
                      "Solicitante",
                      "Cargo",
                      "Departamento",
                      "Tipo de impressão",
                      "Finalidade",
                      "Cópias",
                      "Retirada",
                      "Status",
                      "Coordenador",
                      "Decisão em",
                      "Impressor",
                      "Folhas perdidas",
                    ],
                    ...data.geral.map((g) => [
                      g.id,
                      fmtData(g.data),
                      g.solicitante,
                      g.cargo,
                      g.departamento,
                      g.tipoImpressao,
                      g.finalidade,
                      g.copias,
                      fmtDataRetirada(g.dataRetirada),
                      STATUS_LABEL[g.status] ?? g.status,
                      g.coordenador ?? "—",
                      fmtDataHora(g.decididoEm),
                      g.impressor ?? "—",
                      g.folhasPerdidas,
                    ]),
                  ])
                }
              >
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <Th>Nº</Th>
                      <Th>Data</Th>
                      <Th>Solicitante</Th>
                      <Th>Cargo</Th>
                      <Th>Depto.</Th>
                      <Th>Tipo</Th>
                      <Th>Finalidade</Th>
                      <Th>Cópias</Th>
                      <Th>Retirada</Th>
                      <Th>Status</Th>
                      <Th>Coordenador</Th>
                      <Th>Decisão</Th>
                      <Th>Impressor</Th>
                      <Th>Folhas perdidas</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.geral.map((g) => (
                      <tr key={g.id}>
                        <Td>#{g.id}</Td>
                        <Td>{fmtData(g.data)}</Td>
                        <Td>{g.solicitante}</Td>
                        <Td>{g.cargo}</Td>
                        <Td>{g.departamento}</Td>
                        <Td>{g.tipoImpressao}</Td>
                        <Td>{g.finalidade}</Td>
                        <Td>{g.copias}</Td>
                        <Td>{fmtDataRetirada(g.dataRetirada)}</Td>
                        <Td>{STATUS_LABEL[g.status] ?? g.status}</Td>
                        <Td>{g.coordenador ?? "—"}</Td>
                        <Td>{fmtDataHora(g.decididoEm)}</Td>
                        <Td>{g.impressor ?? "—"}</Td>
                        <Td>{g.folhasPerdidas}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.geral.length === 0 && <Empty />}
              </Section>
            )}

            {tab === "periodo" && (
              <Section
                title="1.2 Relatório de Solicitações por Período"
                onExport={() =>
                  downloadCsv("relatorio-periodo.csv", [
                    ["Status", "Quantidade", "Percentual (%)"],
                    ["Total", data.porPeriodo.total, 100],
                    ["Aguardando", data.porPeriodo.aguardando, data.porPeriodo.percentuais.aguardando],
                    ["Aprovadas", data.porPeriodo.aprovadas, data.porPeriodo.percentuais.aprovadas],
                    ["Rejeitadas", data.porPeriodo.rejeitadas, data.porPeriodo.percentuais.rejeitadas],
                    ["Imprimindo", data.porPeriodo.imprimindo, data.porPeriodo.percentuais.imprimindo],
                    ["Concluídas", data.porPeriodo.concluidas, data.porPeriodo.percentuais.concluidas],
                    ["Canceladas", data.porPeriodo.canceladas, data.porPeriodo.percentuais.canceladas],
                  ])
                }
              >
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  <Card title="Total" value={data.porPeriodo.total} hint={periodoLabel} />
                  <Card title="Aprovadas" value={data.porPeriodo.aprovadas} hint={`${data.porPeriodo.percentuais.aprovadas}%`} />
                  <Card title="Rejeitadas" value={data.porPeriodo.rejeitadas} hint={`${data.porPeriodo.percentuais.rejeitadas}%`} />
                  <Card title="Canceladas" value={data.porPeriodo.canceladas} hint={`${data.porPeriodo.percentuais.canceladas}%`} />
                  <Card title="Concluídas" value={data.porPeriodo.concluidas} hint={`${data.porPeriodo.percentuais.concluidas}%`} />
                  <Card title="Aguardando" value={data.porPeriodo.aguardando} hint={`${data.porPeriodo.percentuais.aguardando}%`} />
                  <Card title="Imprimindo" value={data.porPeriodo.imprimindo} hint={`${data.porPeriodo.percentuais.imprimindo}%`} />
                </div>
              </Section>
            )}

            {tab === "solicitante" && (
              <Section
                title="1.3 Relatório por Solicitante"
                onExport={() =>
                  downloadCsv("relatorio-solicitante.csv", [
                    ["Solicitante", "Cargo", "Departamento", "Solicitações", "Aprovadas", "Rejeitadas", "Concluídas", "Total de cópias"],
                    ...data.porSolicitante.map((s) => [
                      s.nome,
                      s.cargo,
                      s.departamento,
                      s.solicitacoes,
                      s.aprovadas,
                      s.rejeitadas,
                      s.concluidas,
                      s.totalCopias,
                    ]),
                  ])
                }
              >
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <Th>Solicitante</Th>
                      <Th>Cargo</Th>
                      <Th>Departamento</Th>
                      <Th>Solicitações</Th>
                      <Th>Aprovadas</Th>
                      <Th>Rejeitadas</Th>
                      <Th>Concluídas</Th>
                      <Th>Total de cópias</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.porSolicitante.map((s, i) => (
                      <tr key={i}>
                        <Td>{s.nome}</Td>
                        <Td>{s.cargo}</Td>
                        <Td>{s.departamento}</Td>
                        <Td>{s.solicitacoes}</Td>
                        <Td>{s.aprovadas}</Td>
                        <Td>{s.rejeitadas}</Td>
                        <Td>{s.concluidas}</Td>
                        <Td>{s.totalCopias}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.porSolicitante.length === 0 && <Empty />}
              </Section>
            )}

            {tab === "departamento" && (
              <Section
                title="1.4 Relatório por Departamento ou Área"
                onExport={() =>
                  downloadCsv("relatorio-departamento.csv", [
                    ["Departamento", "Solicitações", "Usuários solicitantes", "Total de cópias", "Aprovadas", "Rejeitadas"],
                    ...data.porDepartamento.map((d) => [
                      d.departamento,
                      d.solicitacoes,
                      d.usuariosSolicitantes,
                      d.totalCopias,
                      d.aprovadas,
                      d.rejeitadas,
                    ]),
                  ])
                }
              >
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <Th>Departamento</Th>
                      <Th>Solicitações</Th>
                      <Th>Usuários solicitantes</Th>
                      <Th>Total de cópias</Th>
                      <Th>Aprovadas</Th>
                      <Th>Rejeitadas</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.porDepartamento.map((d, i) => (
                      <tr key={i}>
                        <Td>{d.departamento}</Td>
                        <Td>{d.solicitacoes}</Td>
                        <Td>{d.usuariosSolicitantes}</Td>
                        <Td>{d.totalCopias}</Td>
                        <Td>{d.aprovadas}</Td>
                        <Td>{d.rejeitadas}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.porDepartamento.length === 0 && <Empty />}
              </Section>
            )}

            {tab === "aprovacoes" && (
              <Section
                title="1.5 Relatório de Aprovações"
                onExport={() =>
                  downloadCsv("relatorio-aprovacoes.csv", [
                    ["Coordenador", "Analisadas", "Aprovadas", "Rejeitadas", "Última decisão"],
                    ...data.aprovacoes.map((a) => [
                      a.nome,
                      a.analisadas,
                      a.aprovadas,
                      a.rejeitadas,
                      fmtDataHora(a.decisoes[0]?.data ?? null),
                    ]),
                  ])
                }
              >
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <Th>Coordenador</Th>
                      <Th>Analisadas</Th>
                      <Th>Aprovadas</Th>
                      <Th>Rejeitadas</Th>
                      <Th>Decisões (mais recentes)</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.aprovacoes.map((a, i) => (
                      <tr key={i}>
                        <Td>{a.nome}</Td>
                        <Td>{a.analisadas}</Td>
                        <Td>{a.aprovadas}</Td>
                        <Td>{a.rejeitadas}</Td>
                        <Td>
                          {a.decisoes.slice(0, 5).map((d, j) => (
                            <span key={j} className="mr-2 inline-block whitespace-nowrap">
                              #{d.id} {d.status === "REJEITADA" ? "✗" : "✓"} {fmtDataHora(d.data)};
                            </span>
                          ))}
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.aprovacoes.length === 0 && <Empty />}
              </Section>
            )}

            {tab === "producao" && (
              <Section
                title="1.6 Relatório de Produção de Impressão"
                onExport={() =>
                  downloadCsv("relatorio-producao.csv", [
                    [
                      "Impressor",
                      "Solicitações impressas",
                      "Total de cópias",
                      "Coloridas",
                      "Preto e branco",
                      "Simples",
                      "Frente e verso",
                      "Folhas perdidas",
                    ],
                    ...data.producao.map((p) => [
                      p.nome,
                      p.solicitacoes,
                      p.totalCopias,
                      p.coloridas,
                      p.pretoBranco,
                      p.simples,
                      p.frenteVerso,
                      p.folhasPerdidas,
                    ]),
                  ])
                }
              >
                <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <Card title="Impressões realizadas" value={data.totalImpressoesRealizadas} />
                  <Card title="Folhas perdidas (total)" value={data.totalFolhasPerdidas} />
                </div>
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <Th>Impressor</Th>
                      <Th>Impressas</Th>
                      <Th>Total de cópias</Th>
                      <Th>Coloridas</Th>
                      <Th>P&B</Th>
                      <Th>Simples</Th>
                      <Th>Frente e verso</Th>
                      <Th>Folhas perdidas</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.producao.map((p, i) => (
                      <tr key={i}>
                        <Td>{p.nome}</Td>
                        <Td>{p.solicitacoes}</Td>
                        <Td>{p.totalCopias}</Td>
                        <Td>{p.coloridas}</Td>
                        <Td>{p.pretoBranco}</Td>
                        <Td>{p.simples}</Td>
                        <Td>{p.frenteVerso}</Td>
                        <Td>{p.folhasPerdidas}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.producao.length === 0 && <Empty />}
              </Section>
            )}

            {tab === "recursos" && (
              <Section
                title="1.7 Relatório de Utilização de Recursos"
                onExport={() =>
                  downloadCsv("relatorio-recursos.csv", [
                    ["Tipo de papel", "Quantidade", "Total de cópias", "Coloridas", "Preto e branco", "Acabamentos"],
                    ...data.recursos.map((r) => [
                      r.tipoPapel,
                      r.quantidade,
                      r.totalCopias,
                      r.coloridas,
                      r.pretoBranco,
                      r.acabamentos.map((a) => `${a.nome}: ${a.quantidade}`).join(" | "),
                    ]),
                  ])
                }
              >
                <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <Card title="Total de impressões realizadas" value={data.totalImpressoesRealizadas} />
                </div>
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <Th>Tipo de papel</Th>
                      <Th>Quantidade</Th>
                      <Th>Total de cópias</Th>
                      <Th>Coloridas</Th>
                      <Th>P&B</Th>
                      <Th>Acabamentos</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recursos.map((r, i) => (
                      <tr key={i}>
                        <Td>{r.tipoPapel}</Td>
                        <Td>{r.quantidade}</Td>
                        <Td>{r.totalCopias}</Td>
                        <Td>{r.coloridas}</Td>
                        <Td>{r.pretoBranco}</Td>
                        <Td>{r.acabamentos.map((a) => `${a.nome}: ${a.quantidade}`).join(", ") || "—"}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.recursos.length === 0 && <Empty />}
              </Section>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function Section({
  title,
  onExport,
  children,
}: {
  title: string;
  onExport: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-soft">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[18px] font-extrabold text-[#1f1f1f]">{title}</h2>
        <ExportButton onClick={onExport} />
      </div>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

function Empty() {
  return <p className="px-3 py-6 text-[14px] text-[#7a7a7a]">Nenhum dado para o período selecionado.</p>;
}
