import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { hasPermission, MANAGE_USERS_PERMISSION } from "@/lib/permissions";

function currentUserId(ctx: { session?: { user?: { id?: string } } | null }) {
  const userId = Number(ctx.session?.user?.id);
  if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });
  return userId;
}

function require(ctx: { session?: { user?: { permissions?: unknown } } | null }, permission: string) {
  if (!hasPermission(ctx.session?.user?.permissions as never, permission)) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
}

/** Data de hoje (fuso -03:00) no formato YYYY-MM-DD. */
function hojeStr() {
  const now = new Date();
  const local = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

const resumoSelect = {
  id: true,
  intuito: true,
  copias: true,
  cor: true,
  modelo: true,
  status: true,
  dataRetirada: true,
  horarioRetirada: true,
  createdAt: true,
} as const;

export const dashboardRouter = createTRPCRouter({
  // ---------- 2.1 Dashboard do Solicitante ----------
  solicitante: protectedProcedure.query(async ({ ctx }) => {
    const userId = currentUserId(ctx);

    const solicitacoes = await ctx.prisma.solicitacao.findMany({
      where: { solicitanteId: userId },
      orderBy: { createdAt: "desc" },
    });

    const count = (status: string) => solicitacoes.filter((s) => s.status === status).length;

    const ultimas = solicitacoes.slice(0, 5).map((s) => ({
      id: s.id,
      intuito: s.intuito,
      copias: s.copias,
      status: s.status,
      dataRetirada: s.dataRetirada,
      horarioRetirada: s.horarioRetirada,
      createdAt: s.createdAt.toISOString(),
    }));

    const notificacoesNaoLidas = await ctx.prisma.notification.count({
      where: { userId, read: false },
    });

    return {
      emAndamento: count("AGUARDANDO") + count("APROVADA") + count("IMPRIMINDO"),
      aprovadas: count("APROVADA"),
      rejeitadas: count("REJEITADA"),
      concluidas: count("IMPRESSA"),
      canceladas: count("CANCELADA"),
      total: solicitacoes.length,
      ultimas,
      notificacoesNaoLidas,
    };
  }),

  // ---------- 2.2 Dashboard do Coordenador ----------
  coordenador: protectedProcedure.query(async ({ ctx }) => {
    require(ctx, "Aprovar solicitações de impressão");

    const solicitacoes = await ctx.prisma.solicitacao.findMany({
      orderBy: { createdAt: "desc" },
      include: { solicitante: { include: { department: true } } },
    });

    const count = (status: string) => solicitacoes.filter((s) => s.status === status).length;

    const pendentes = solicitacoes
      .filter((s) => s.status === "AGUARDANDO")
      .map((s) => ({
        id: s.id,
        solicitante: s.solicitante.name,
        departamento: s.solicitante.department.name,
        intuito: s.intuito,
        copias: s.copias,
        dataRetirada: s.dataRetirada,
        createdAt: s.createdAt.toISOString(),
      }));

    const historicoAprovacoes = solicitacoes
      .filter((s) => s.aprovadorId === currentUserId(ctx) && s.status !== "REJEITADA" && s.decididoEm)
      .slice(0, 10)
      .map((s) => ({ id: s.id, solicitante: s.solicitante.name, data: s.decididoEm?.toISOString() ?? null }));

    const historicoRejeicoes = solicitacoes
      .filter((s) => s.aprovadorId === currentUserId(ctx) && s.status === "REJEITADA" && s.decididoEm)
      .slice(0, 10)
      .map((s) => ({ id: s.id, solicitante: s.solicitante.name, data: s.decididoEm?.toISOString() ?? null }));

    const porDepartamento = new Map<string, number>();
    const porFinalidade = new Map<string, number>();
    for (const s of solicitacoes) {
      const dept = s.solicitante.department.name;
      porDepartamento.set(dept, (porDepartamento.get(dept) ?? 0) + 1);
      porFinalidade.set(s.intuito, (porFinalidade.get(s.intuito) ?? 0) + 1);
    }

    return {
      pendentesAprovacao: count("AGUARDANDO"),
      aprovadas: count("APROVADA"),
      rejeitadas: count("REJEITADA"),
      concluidas: count("IMPRESSA"),
      aguardandoAnalise: pendentes,
      historicoAprovacoes,
      historicoRejeicoes,
      porDepartamento: [...porDepartamento.entries()]
        .map(([nome, quantidade]) => ({ nome, quantidade }))
        .sort((a, b) => b.quantidade - a.quantidade),
      porFinalidade: [...porFinalidade.entries()]
        .map(([nome, quantidade]) => ({ nome, quantidade }))
        .sort((a, b) => b.quantidade - a.quantidade),
    };
  }),

  // ---------- 2.3 Dashboard do Impressor ----------
  impressor: protectedProcedure.query(async ({ ctx }) => {
    require(ctx, "Executar impressão de documentos");

    const hoje = hojeStr();

    const solicitacoes = await ctx.prisma.solicitacao.findMany({
      where: { status: { in: ["APROVADA", "IMPRIMINDO", "IMPRESSA"] } },
      orderBy: { dataRetirada: "asc" },
      include: { solicitante: { include: { department: true } } },
    });

    const pendentes = solicitacoes.filter((s) => s.status === "APROVADA");
    const emProducao = solicitacoes.filter((s) => s.status === "IMPRIMINDO");
    const concluidas = solicitacoes.filter((s) => s.status === "IMPRESSA");
    const entregues = concluidas.filter((s) => s.dataRetirada <= hoje);

    const map = (s: (typeof solicitacoes)[number]) => ({
      id: s.id,
      solicitante: s.solicitante.name,
      departamento: s.solicitante.department.name,
      intuito: s.intuito,
      copias: s.copias,
      cor: s.cor,
      modelo: s.modelo,
      status: s.status,
      dataRetirada: s.dataRetirada,
      horarioRetirada: s.horarioRetirada,
    });

    // Fila do dia: tudo que precisa ser impresso e cuja retirada é hoje.
    const filaDoDia = [...pendentes, ...emProducao].filter((s) => s.dataRetirada === hoje).map(map);

    // Atrasadas: ainda não impressas e com retirada já vencida.
    const atrasadas = [...pendentes, ...emProducao].filter((s) => s.dataRetirada < hoje).map(map);

    // Prioritárias: retirada hoje ou já vencida e ainda não impressas.
    const prioritarias = [...pendentes, ...emProducao].filter((s) => s.dataRetirada <= hoje).map(map);

    // Próximas retiradas: ainda não entregues, ordenadas por data.
    const proximasRetiradas = [...pendentes, ...emProducao]
      .filter((s) => s.dataRetirada >= hoje)
      .slice(0, 8)
      .map(map);

    return {
      pendentes: pendentes.length,
      emProducao: emProducao.length,
      concluidas: concluidas.length,
      entregues: entregues.length,
      filaDoDia,
      proximasRetiradas,
      prioritarias,
      atrasadas,
    };
  }),

  // ---------- 2.4 Dashboard do Administrador ----------
  administrador: protectedProcedure.query(async ({ ctx }) => {
    require(ctx, MANAGE_USERS_PERMISSION);

    const [users, roles, permissions, departments, solicitacoes] = await Promise.all([
      ctx.prisma.user.findMany({ include: { role: { include: { permissions: true } } } }),
      ctx.prisma.role.count(),
      ctx.prisma.permission.count(),
      ctx.prisma.department.count(),
      ctx.prisma.solicitacao.findMany({ select: { status: true, createdAt: true } }),
    ]);

    const countByPerm = (permission: string) =>
      users.filter((u) => hasPermission(u.role.permissions, permission)).length;

    const countByRole = (roleName: string) =>
      users.filter((u) => u.role.name.toLowerCase() === roleName.toLowerCase()).length;

    const porStatus = new Map<string, number>();
    const porMes = new Map<string, number>();
    for (const s of solicitacoes) {
      porStatus.set(s.status, (porStatus.get(s.status) ?? 0) + 1);
      const mes = s.createdAt.toISOString().slice(0, 7); // YYYY-MM
      porMes.set(mes, (porMes.get(mes) ?? 0) + 1);
    }

    return {
      usuarios: users.length,
      solicitantes: countByPerm("Criar solicitações de impressão"),
      coordenadores: countByPerm("Aprovar solicitações de impressão"),
      impressores: countByPerm("Executar impressão de documentos"),
      solicitacoesTotais: solicitacoes.length,
      cargos: roles,
      permissoes: permissions,
      departamentos: departments,
      // contagens por cargo nominal (úteis quando os nomes batem com os do seed)
      cargosNominais: {
        professores: countByRole("Professor"),
        coordenadores: countByRole("Coordenador"),
        impressores: countByRole("Impressor"),
      },
      porStatus: [...porStatus.entries()].map(([nome, quantidade]) => ({ nome, quantidade })),
      porMes: [...porMes.entries()].map(([mes, quantidade]) => ({ mes, quantidade })).sort((a, b) => a.mes.localeCompare(b.mes)),
    };
  }),
});
