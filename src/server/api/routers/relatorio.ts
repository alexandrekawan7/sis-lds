import { z } from "zod";

import { createTRPCRouter, relatorioProcedure } from "@/server/api/trpc";

const periodoInput = z
  .object({
    inicio: z.string().optional(),
    fim: z.string().optional(),
  })
  .optional();

const COLORIDO = "Colorido";
const FRENTE_VERSO = "Frente e Verso";

function buildWhere(input: { inicio?: string; fim?: string } | undefined) {
  const where: { createdAt?: { gte?: Date; lte?: Date } } = {};

  if (input?.inicio) {
    where.createdAt = { ...where.createdAt, gte: new Date(`${input.inicio}T00:00:00.000-03:00`) };
  }
  if (input?.fim) {
    where.createdAt = { ...where.createdAt, lte: new Date(`${input.fim}T23:59:59.999-03:00`) };
  }

  return where;
}

function pct(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 1000) / 10;
}

/**
 * Router de Relatórios.
 *
 * Exige a permissão "Visualizar e exportar relatórios de folhas".
 * A query `completo` retorna, em uma única chamada, todos os relatórios
 * descritos no documento de requisitos (1.1 a 1.7), já calculados no servidor.
 */
export const relatorioRouter = createTRPCRouter({
  completo: relatorioProcedure.input(periodoInput).query(async ({ ctx, input }) => {
    const where = buildWhere(input);

    const solicitacoes = await ctx.prisma.solicitacao.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        solicitante: { include: { role: true, department: true } },
        aprovador: { include: { role: true } },
        impressor: { include: { role: true } },
      },
    });

    const total = solicitacoes.length;

    const isColorido = (s: (typeof solicitacoes)[number]) => s.cor.trim().toLowerCase() === COLORIDO.toLowerCase();
    const isFrenteVerso = (s: (typeof solicitacoes)[number]) =>
      s.modelo.trim().toLowerCase() === FRENTE_VERSO.toLowerCase();

    // ---------- 1.1 Relatório Geral de Solicitações ----------
    const geral = solicitacoes.map((s) => ({
      id: s.id,
      data: s.createdAt.toISOString(),
      solicitante: s.solicitante.name,
      cargo: s.solicitante.role.name,
      departamento: s.solicitante.department.name,
      tipoImpressao: `${s.cor} / ${s.modelo}`,
      finalidade: s.intuito,
      copias: s.copias,
      dataRetirada: s.dataRetirada,
      status: s.status,
      coordenador: s.aprovador?.name ?? null,
      decididoEm: s.decididoEm ? s.decididoEm.toISOString() : null,
      impressor: s.impressor?.name ?? null,
      folhasPerdidas: s.folhasPerdidas,
    }));

    // ---------- 1.2 Relatório de Solicitações por Período ----------
    const countStatus = (status: string) => solicitacoes.filter((s) => s.status === status).length;
    const aprovadas = countStatus("APROVADA");
    const rejeitadas = countStatus("REJEITADA");
    const canceladas = countStatus("CANCELADA");
    const concluidas = countStatus("IMPRESSA");
    const aguardando = countStatus("AGUARDANDO");
    const imprimindo = countStatus("IMPRIMINDO");

    const porPeriodo = {
      inicio: input?.inicio ?? null,
      fim: input?.fim ?? null,
      total,
      aguardando,
      aprovadas,
      rejeitadas,
      imprimindo,
      concluidas,
      canceladas,
      percentuais: {
        aguardando: pct(aguardando, total),
        aprovadas: pct(aprovadas, total),
        rejeitadas: pct(rejeitadas, total),
        imprimindo: pct(imprimindo, total),
        concluidas: pct(concluidas, total),
        canceladas: pct(canceladas, total),
      },
    };

    // ---------- 1.3 Relatório por Solicitante ----------
    const solicitanteMap = new Map<
      number,
      {
        nome: string;
        cargo: string;
        departamento: string;
        solicitacoes: number;
        aprovadas: number;
        rejeitadas: number;
        concluidas: number;
        totalCopias: number;
      }
    >();
    for (const s of solicitacoes) {
      const entry =
        solicitanteMap.get(s.solicitanteId) ?? {
          nome: s.solicitante.name,
          cargo: s.solicitante.role.name,
          departamento: s.solicitante.department.name,
          solicitacoes: 0,
          aprovadas: 0,
          rejeitadas: 0,
          concluidas: 0,
          totalCopias: 0,
        };
      entry.solicitacoes += 1;
      entry.totalCopias += s.copias;
      if (s.status === "APROVADA") entry.aprovadas += 1;
      if (s.status === "REJEITADA") entry.rejeitadas += 1;
      if (s.status === "IMPRESSA") entry.concluidas += 1;
      solicitanteMap.set(s.solicitanteId, entry);
    }
    const porSolicitante = [...solicitanteMap.values()].sort((a, b) => b.solicitacoes - a.solicitacoes);

    // ---------- 1.4 Relatório por Departamento ou Área ----------
    const deptMap = new Map<
      string,
      {
        departamento: string;
        solicitacoes: number;
        solicitantes: Set<number>;
        totalCopias: number;
        aprovadas: number;
        rejeitadas: number;
      }
    >();
    for (const s of solicitacoes) {
      const nome = s.solicitante.department.name;
      const entry =
        deptMap.get(nome) ?? {
          departamento: nome,
          solicitacoes: 0,
          solicitantes: new Set<number>(),
          totalCopias: 0,
          aprovadas: 0,
          rejeitadas: 0,
        };
      entry.solicitacoes += 1;
      entry.solicitantes.add(s.solicitanteId);
      entry.totalCopias += s.copias;
      if (s.status === "APROVADA") entry.aprovadas += 1;
      if (s.status === "REJEITADA") entry.rejeitadas += 1;
      deptMap.set(nome, entry);
    }
    const porDepartamento = [...deptMap.values()]
      .map((d) => ({
        departamento: d.departamento,
        solicitacoes: d.solicitacoes,
        usuariosSolicitantes: d.solicitantes.size,
        totalCopias: d.totalCopias,
        aprovadas: d.aprovadas,
        rejeitadas: d.rejeitadas,
      }))
      .sort((a, b) => b.solicitacoes - a.solicitacoes);

    // ---------- 1.5 Relatório de Aprovações ----------
    const aprovadorMap = new Map<
      number,
      {
        nome: string;
        analisadas: number;
        aprovadas: number;
        rejeitadas: number;
        decisoes: { id: number; status: string; data: string | null }[];
      }
    >();
    for (const s of solicitacoes) {
      if (!s.aprovadorId || !s.aprovador) continue;
      if (s.status !== "APROVADA" && s.status !== "REJEITADA" && s.status !== "IMPRIMINDO" && s.status !== "IMPRESSA")
        continue;
      const entry =
        aprovadorMap.get(s.aprovadorId) ?? {
          nome: s.aprovador.name,
          analisadas: 0,
          aprovadas: 0,
          rejeitadas: 0,
          decisoes: [] as { id: number; status: string; data: string | null }[],
        };
      entry.analisadas += 1;
      if (s.status === "REJEITADA") entry.rejeitadas += 1;
      else entry.aprovadas += 1; // aprovada / imprimindo / impressa => foi aprovada
      entry.decisoes.push({
        id: s.id,
        status: s.status === "REJEITADA" ? "REJEITADA" : "APROVADA",
        data: s.decididoEm ? s.decididoEm.toISOString() : null,
      });
      aprovadorMap.set(s.aprovadorId, entry);
    }
    const aprovacoes = [...aprovadorMap.values()].sort((a, b) => b.analisadas - a.analisadas);

    // ---------- 1.6 Relatório de Produção de Impressão ----------
    const impressas = solicitacoes.filter((s) => s.status === "IMPRESSA");
    const impressorMap = new Map<
      number,
      {
        nome: string;
        solicitacoes: number;
        totalCopias: number;
        coloridas: number;
        pretoBranco: number;
        simples: number;
        frenteVerso: number;
        folhasPerdidas: number;
      }
    >();
    for (const s of impressas) {
      if (!s.impressorId || !s.impressor) continue;
      const entry =
        impressorMap.get(s.impressorId) ?? {
          nome: s.impressor.name,
          solicitacoes: 0,
          totalCopias: 0,
          coloridas: 0,
          pretoBranco: 0,
          simples: 0,
          frenteVerso: 0,
          folhasPerdidas: 0,
        };
      entry.solicitacoes += 1;
      entry.totalCopias += s.copias;
      if (isColorido(s)) entry.coloridas += 1;
      else entry.pretoBranco += 1;
      if (isFrenteVerso(s)) entry.frenteVerso += 1;
      else entry.simples += 1;
      entry.folhasPerdidas += s.folhasPerdidas;
      impressorMap.set(s.impressorId, entry);
    }
    const producao = [...impressorMap.values()].sort((a, b) => b.solicitacoes - a.solicitacoes);

    // ---------- 1.7 Relatório de Utilização de Recursos ----------
    const papelMap = new Map<
      string,
      {
        tipoPapel: string;
        quantidade: number;
        totalCopias: number;
        coloridas: number;
        pretoBranco: number;
        acabamentos: Map<string, number>;
      }
    >();
    for (const s of impressas) {
      const entry =
        papelMap.get(s.tipoPapel) ?? {
          tipoPapel: s.tipoPapel,
          quantidade: 0,
          totalCopias: 0,
          coloridas: 0,
          pretoBranco: 0,
          acabamentos: new Map<string, number>(),
        };
      entry.quantidade += 1;
      entry.totalCopias += s.copias;
      if (isColorido(s)) entry.coloridas += 1;
      else entry.pretoBranco += 1;
      entry.acabamentos.set(s.acabamento, (entry.acabamentos.get(s.acabamento) ?? 0) + 1);
      papelMap.set(s.tipoPapel, entry);
    }
    const recursos = [...papelMap.values()]
      .map((p) => ({
        tipoPapel: p.tipoPapel,
        quantidade: p.quantidade,
        totalCopias: p.totalCopias,
        coloridas: p.coloridas,
        pretoBranco: p.pretoBranco,
        acabamentos: [...p.acabamentos.entries()].map(([nome, qtd]) => ({ nome, quantidade: qtd })),
      }))
      .sort((a, b) => b.quantidade - a.quantidade);

    const totalImpressoesRealizadas = impressas.length;
    const totalFolhasPerdidas = impressas.reduce((acc, s) => acc + s.folhasPerdidas, 0);

    return {
      geral,
      porPeriodo,
      porSolicitante,
      porDepartamento,
      aprovacoes,
      producao,
      recursos,
      totalImpressoesRealizadas,
      totalFolhasPerdidas,
    };
  }),
});
