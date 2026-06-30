"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { hasPermission, MANAGE_USERS_PERMISSION, canAccessSolicitacoes } from "@/lib/permissions";
import { useTRPC } from "@/trpc/react";

const STATUS_LABEL: Record<string, string> = {
  AGUARDANDO: "Aguardando",
  APROVADA: "Aprovada",
  REJEITADA: "Rejeitada",
  IMPRIMINDO: "Imprimindo",
  IMPRESSA: "Impressa",
  CANCELADA: "Cancelada",
};

function fmtRetirada(value: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(value);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : value;
}

function fmtDataHora(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function fmtMes(mes: string) {
  const [y, m] = mes.split("-");
  const nomes = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return `${nomes[Number(m) - 1] ?? m}/${y}`;
}

function Stat({ title, value, accent }: { title: string; value: React.ReactNode; accent?: string }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-soft">
      <p className="text-[13px] font-semibold text-[#7a7a7a]">{title}</p>
      <p className={`mt-1 text-[30px] font-extrabold ${accent ?? "text-[#1f1f1f]"}`}>{value}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-soft">
      <h3 className="mb-4 text-[17px] font-extrabold text-[#1f1f1f]">{title}</h3>
      {children}
    </div>
  );
}

function BarList({ items }: { items: { nome: string; quantidade: number }[] }) {
  const max = Math.max(1, ...items.map((i) => i.quantidade));
  if (items.length === 0) return <p className="text-[14px] text-[#7a7a7a]">Sem dados.</p>;
  return (
    <div className="space-y-3">
      {items.map((i, idx) => (
        <div key={idx}>
          <div className="flex items-center justify-between text-[13px] text-[#3a3a3a]">
            <span className="font-semibold">{i.nome}</span>
            <span>{i.quantidade}</span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-gray-100">
            <div className="h-2 rounded-full bg-[#2ea03b]" style={{ width: `${(i.quantidade / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const trpc = useTRPC();

  const meQuery = useQuery(trpc.user.me.queryOptions());
  const perms = meQuery.data?.role.permissions;

  const isAdmin = hasPermission(perms, MANAGE_USERS_PERMISSION);
  const isCoordenador = hasPermission(perms, "Aprovar solicitações de impressão");
  const isImpressor = hasPermission(perms, "Executar impressão de documentos");
  const isSolicitante =
    hasPermission(perms, "Criar solicitações de impressão") ||
    canAccessSolicitacoes(meQuery.data?.role.name);

  const adminQuery = useQuery({ ...trpc.dashboard.administrador.queryOptions(), enabled: !!meQuery.data && isAdmin });
  const coordQuery = useQuery({ ...trpc.dashboard.coordenador.queryOptions(), enabled: !!meQuery.data && isCoordenador });
  const impressorQuery = useQuery({ ...trpc.dashboard.impressor.queryOptions(), enabled: !!meQuery.data && isImpressor });
  const solicitanteQuery = useQuery({ ...trpc.dashboard.solicitante.queryOptions(), enabled: !!meQuery.data && isSolicitante });

  useEffect(() => {
    if (meQuery.isLoading) return;
    if (!meQuery.data) router.replace("/");
  }, [meQuery.data, meQuery.isLoading, router]);

  if (meQuery.isLoading || !meQuery.data) {
    return (
      <main className="flex-1 p-8 md:p-16">
        <p className="text-[15px] font-semibold text-[#7a7a7a]">Carregando...</p>
      </main>
    );
  }

  const admin = adminQuery.data;
  const coord = coordQuery.data;
  const impressor = impressorQuery.data;
  const solicitante = solicitanteQuery.data;

  return (
    <main className="flex-1 space-y-12 px-8 pb-16 pt-12 md:px-16">
      <div>
        <p className="text-[15px] text-[#7a7a7a]">Olá, {meQuery.data.name.split(" ")[0]}!</p>
        <h1 className="mt-1 text-[26px] font-bold text-[#1f1f1f]">Painel</h1>
      </div>

      {/* 2.4 Administrador */}
      {isAdmin && admin && (
        <section className="space-y-5">
          <h2 className="text-[20px] font-extrabold text-[#1f1f1f]">Administrador</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <Stat title="Usuários cadastrados" value={admin.usuarios} />
            <Stat title="Solicitantes" value={admin.solicitantes} />
            <Stat title="Coordenadores" value={admin.coordenadores} />
            <Stat title="Impressores" value={admin.impressores} />
            <Stat title="Solicitações totais" value={admin.solicitacoesTotais} />
            <Stat title="Cargos" value={admin.cargos} />
            <Stat title="Permissões" value={admin.permissoes} />
            <Stat title="Departamentos" value={admin.departamentos} />
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <Panel title="Solicitações por mês">
              <BarList items={admin.porMes.map((m) => ({ nome: fmtMes(m.mes), quantidade: m.quantidade }))} />
            </Panel>
            <Panel title="Solicitações por status">
              <BarList items={admin.porStatus.map((s) => ({ nome: STATUS_LABEL[s.nome] ?? s.nome, quantidade: s.quantidade }))} />
            </Panel>
          </div>
        </section>
      )}

      {/* 2.2 Coordenador */}
      {isCoordenador && coord && (
        <section className="space-y-5">
          <h2 className="text-[20px] font-extrabold text-[#1f1f1f]">Coordenador</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat title="Pendentes de aprovação" value={coord.pendentesAprovacao} accent="text-[#e0892b]" />
            <Stat title="Aprovadas" value={coord.aprovadas} accent="text-[#3b62d8]" />
            <Stat title="Rejeitadas" value={coord.rejeitadas} accent="text-[#d92d2d]" />
            <Stat title="Concluídas" value={coord.concluidas} accent="text-[#2ea03b]" />
          </div>
          <Panel title="Aguardando análise">
            {coord.aguardandoAnalise.length === 0 ? (
              <p className="text-[14px] text-[#7a7a7a]">Nenhuma solicitação aguardando análise.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="text-left text-[13px] font-extrabold text-[#1f1f1f]">
                      <th className="border-b border-black/10 px-3 py-2">Nº</th>
                      <th className="border-b border-black/10 px-3 py-2">Solicitante</th>
                      <th className="border-b border-black/10 px-3 py-2">Departamento</th>
                      <th className="border-b border-black/10 px-3 py-2">Finalidade</th>
                      <th className="border-b border-black/10 px-3 py-2">Cópias</th>
                      <th className="border-b border-black/10 px-3 py-2">Retirada</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coord.aguardandoAnalise.map((s) => (
                      <tr key={s.id} className="text-[13px] text-[#3a3a3a]">
                        <td className="border-b border-black/5 px-3 py-2">#{s.id}</td>
                        <td className="border-b border-black/5 px-3 py-2">{s.solicitante}</td>
                        <td className="border-b border-black/5 px-3 py-2">{s.departamento}</td>
                        <td className="border-b border-black/5 px-3 py-2">{s.intuito}</td>
                        <td className="border-b border-black/5 px-3 py-2">{s.copias}</td>
                        <td className="border-b border-black/5 px-3 py-2">{fmtRetirada(s.dataRetirada)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
          <div className="grid gap-5 lg:grid-cols-2">
            <Panel title="Solicitações por departamento">
              <BarList items={coord.porDepartamento} />
            </Panel>
            <Panel title="Solicitações por finalidade">
              <BarList items={coord.porFinalidade} />
            </Panel>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <Panel title="Histórico de aprovações">
              {coord.historicoAprovacoes.length === 0 ? (
                <p className="text-[14px] text-[#7a7a7a]">Nenhuma aprovação registrada.</p>
              ) : (
                <ul className="space-y-2 text-[13px] text-[#3a3a3a]">
                  {coord.historicoAprovacoes.map((h, i) => (
                    <li key={i} className="flex justify-between">
                      <span>#{h.id} · {h.solicitante}</span>
                      <span className="text-[#7a7a7a]">{fmtDataHora(h.data)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
            <Panel title="Histórico de rejeições">
              {coord.historicoRejeicoes.length === 0 ? (
                <p className="text-[14px] text-[#7a7a7a]">Nenhuma rejeição registrada.</p>
              ) : (
                <ul className="space-y-2 text-[13px] text-[#3a3a3a]">
                  {coord.historicoRejeicoes.map((h, i) => (
                    <li key={i} className="flex justify-between">
                      <span>#{h.id} · {h.solicitante}</span>
                      <span className="text-[#7a7a7a]">{fmtDataHora(h.data)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </section>
      )}

      {/* 2.3 Impressor */}
      {isImpressor && impressor && (
        <section className="space-y-5">
          <h2 className="text-[20px] font-extrabold text-[#1f1f1f]">Impressor</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat title="Impressões pendentes" value={impressor.pendentes} accent="text-[#3b62d8]" />
            <Stat title="Em produção" value={impressor.emProducao} accent="text-[#8a2be2]" />
            <Stat title="Concluídas" value={impressor.concluidas} accent="text-[#2ea03b]" />
            <Stat title="Entregues" value={impressor.entregues} accent="text-[#2ea03b]" />
          </div>
          <FilaTable title="Fila de impressão do dia" rows={impressor.filaDoDia} emptyText="Nada na fila para hoje." />
          <div className="grid gap-5 lg:grid-cols-2">
            <FilaTable
              title="Próximas retiradas"
              rows={impressor.proximasRetiradas}
              emptyText="Sem retiradas próximas."
              compact
            />
            <FilaTable
              title="Solicitações atrasadas"
              rows={impressor.atrasadas}
              emptyText="Nenhuma solicitação atrasada."
              compact
              danger
            />
          </div>
          <FilaTable
            title="Solicitações prioritárias (retirada para hoje ou vencida)"
            rows={impressor.prioritarias}
            emptyText="Nenhuma solicitação prioritária."
          />
        </section>
      )}

      {/* 2.1 Solicitante */}
      {isSolicitante && solicitante && (
        <section className="space-y-5">
          <h2 className="text-[20px] font-extrabold text-[#1f1f1f]">Minhas solicitações</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <Stat title="Em andamento" value={solicitante.emAndamento} accent="text-[#e0892b]" />
            <Stat title="Aprovadas" value={solicitante.aprovadas} accent="text-[#3b62d8]" />
            <Stat title="Rejeitadas" value={solicitante.rejeitadas} accent="text-[#d92d2d]" />
            <Stat title="Concluídas" value={solicitante.concluidas} accent="text-[#2ea03b]" />
            <Stat title="Canceladas" value={solicitante.canceladas} accent="text-[#7a7a7a]" />
          </div>
          {solicitante.notificacoesNaoLidas > 0 && (
            <div className="rounded-2xl border border-[#2ea03b]/30 bg-[#eaf6ec] p-4 text-[14px] font-semibold text-[#228d2e]">
              Você tem {solicitante.notificacoesNaoLidas} notificação(ões) não lida(s).
            </div>
          )}
          <Panel title="Últimas solicitações">
            {solicitante.ultimas.length === 0 ? (
              <p className="text-[14px] text-[#7a7a7a]">Você ainda não fez solicitações.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="text-left text-[13px] font-extrabold text-[#1f1f1f]">
                      <th className="border-b border-black/10 px-3 py-2">Nº</th>
                      <th className="border-b border-black/10 px-3 py-2">Finalidade</th>
                      <th className="border-b border-black/10 px-3 py-2">Cópias</th>
                      <th className="border-b border-black/10 px-3 py-2">Status</th>
                      <th className="border-b border-black/10 px-3 py-2">Retirada prevista</th>
                    </tr>
                  </thead>
                  <tbody>
                    {solicitante.ultimas.map((s) => (
                      <tr key={s.id} className="text-[13px] text-[#3a3a3a]">
                        <td className="border-b border-black/5 px-3 py-2">#{s.id}</td>
                        <td className="border-b border-black/5 px-3 py-2">{s.intuito}</td>
                        <td className="border-b border-black/5 px-3 py-2">{s.copias}</td>
                        <td className="border-b border-black/5 px-3 py-2">{STATUS_LABEL[s.status] ?? s.status}</td>
                        <td className="border-b border-black/5 px-3 py-2">
                          {fmtRetirada(s.dataRetirada)} às {s.horarioRetirada}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </section>
      )}
    </main>
  );
}

type FilaRow = {
  id: number;
  solicitante: string;
  departamento: string;
  intuito: string;
  copias: number;
  cor: string;
  modelo: string;
  status: string;
  dataRetirada: string;
  horarioRetirada: string;
};

function FilaTable({
  title,
  rows,
  emptyText,
  compact,
  danger,
}: {
  title: string;
  rows: FilaRow[];
  emptyText: string;
  compact?: boolean;
  danger?: boolean;
}) {
  return (
    <Panel title={title}>
      {rows.length === 0 ? (
        <p className="text-[14px] text-[#7a7a7a]">{emptyText}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left text-[13px] font-extrabold text-[#1f1f1f]">
                <th className="border-b border-black/10 px-3 py-2">Nº</th>
                <th className="border-b border-black/10 px-3 py-2">Solicitante</th>
                {!compact && <th className="border-b border-black/10 px-3 py-2">Departamento</th>}
                <th className="border-b border-black/10 px-3 py-2">Cópias</th>
                {!compact && <th className="border-b border-black/10 px-3 py-2">Tipo</th>}
                <th className="border-b border-black/10 px-3 py-2">Retirada</th>
                <th className="border-b border-black/10 px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id} className={`text-[13px] ${danger ? "text-[#b02525]" : "text-[#3a3a3a]"}`}>
                  <td className="border-b border-black/5 px-3 py-2">#{s.id}</td>
                  <td className="border-b border-black/5 px-3 py-2">{s.solicitante}</td>
                  {!compact && <td className="border-b border-black/5 px-3 py-2">{s.departamento}</td>}
                  <td className="border-b border-black/5 px-3 py-2">{s.copias}</td>
                  {!compact && <td className="border-b border-black/5 px-3 py-2">{s.cor} / {s.modelo}</td>}
                  <td className="border-b border-black/5 px-3 py-2">
                    {fmtRetirada(s.dataRetirada)} {s.horarioRetirada}
                  </td>
                  <td className="border-b border-black/5 px-3 py-2">{STATUS_LABEL[s.status] ?? s.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}
