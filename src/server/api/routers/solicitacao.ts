import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, solicitacaoProcedure } from "@/server/api/trpc";
import { hasPermission } from "@/lib/permissions";

const solicitacaoFields = {
  // Etapa 1 - Material
  tipoPapel: z.string().trim().min(1, "Informe o tipo de papel"),
  intuito: z.string().trim().min(1, "Informe o intuito"),
  copias: z.number().int().positive("Informe a quantidade de cópias"),
  // Etapa 2 - Configurações da impressão
  tamanho: z.string().trim().min(1, "Informe o tamanho da folha"),
  orientacao: z.string().trim().min(1, "Informe a orientação"),
  modelo: z.string().trim().min(1, "Informe o modelo"),
  cor: z.string().trim().min(1, "Informe a cor"),
  acabamento: z.string().trim().min(1, "Informe o acabamento"),
  // Etapa 3 - Anexo e retirada
  documento: z.string().trim().min(1).nullable().optional(),
  documentId: z.string().nullable().optional(),
  dataRetirada: z.string().trim().min(1, "Informe a data da retirada"),
  horarioRetirada: z.string().trim().min(1, "Informe o horário da retirada"),
};

const createSolicitacaoInput = z.object(solicitacaoFields);

const updateSolicitacaoInput = z.object({
  id: z.number().int().positive(),
  ...solicitacaoFields,
});

export type CreateSolicitacaoInput = z.infer<typeof createSolicitacaoInput>;

function currentUserId(ctx: { session?: { user?: { id?: string } } | null }) {
  const userId = Number(ctx.session?.user?.id);

  if (!userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return userId;
}

/**
 * Router de Solicitações de impressão.
 *
 * Todas as procedures usam `solicitacaoProcedure`, que garante (no servidor)
 * que apenas usuários com cargo Professor, Convidado ou Coordenador acessem.
 */
export const solicitacaoRouter = createTRPCRouter({
  minhas: solicitacaoProcedure.query(async ({ ctx }) => {
    const userId = currentUserId(ctx);

    const solicitacoes = await ctx.prisma.solicitacao.findMany({
      where: { solicitanteId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        solicitante: {
          include: {
            role: true,
            department: true,
          },
        },
      },
    });

    return solicitacoes.map((solicitacao) => ({
      id: solicitacao.id,
      solicitanteId: solicitacao.solicitanteId,
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
      status: solicitacao.status,
      solicitante: {
        nome: solicitacao.solicitante.name,
        cargo: solicitacao.solicitante.role.name,
        departamento: solicitacao.solicitante.department.name,
      },
    }));
  }),

  todas: solicitacaoProcedure.query(async ({ ctx }) => {
    const hasVisTodas = hasPermission(ctx.session?.user?.permissions, "Visualizar todas as solicitações de impressão");
    const hasImprimir = hasPermission(ctx.session?.user?.permissions, "Executar impressão de documentos");

    if (!hasVisTodas && !hasImprimir) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    const solicitacoes = await ctx.prisma.solicitacao.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        solicitante: {
          include: {
            role: true,
            department: true,
          },
        },
      },
    });

    return solicitacoes.map((solicitacao) => ({
      id: solicitacao.id,
      solicitanteId: solicitacao.solicitanteId,
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
      status: solicitacao.status,
      solicitante: {
        nome: solicitacao.solicitante.name,
        cargo: solicitacao.solicitante.role.name,
        departamento: solicitacao.solicitante.department.name,
      },
    }));
  }),

  criar: solicitacaoProcedure
    .input(createSolicitacaoInput)
    .mutation(async ({ ctx, input }) => {
      if (!hasPermission(ctx.session?.user?.permissions, "Criar solicitações de impressão")) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Você não tem permissão para criar solicitações." });
      }

      const userId = currentUserId(ctx);

      const solicitacao = await ctx.prisma.solicitacao.create({
        data: {
          ...input,
          documento: input.documento ?? null,
          solicitanteId: userId,
        },
      });

      return { success: true, id: solicitacao.id };
    }),

  atualizar: solicitacaoProcedure
    .input(updateSolicitacaoInput)
    .mutation(async ({ ctx, input }) => {
      const userId = currentUserId(ctx);
      const { id, ...data } = input;

      const solicitacao = await ctx.prisma.solicitacao.findUnique({ where: { id } });

      if (!solicitacao || solicitacao.solicitanteId !== userId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Solicitação não encontrada." });
      }

      if (solicitacao.status !== "AGUARDANDO") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Só é possível editar solicitações que ainda estão aguardando aprovação.",
        });
      }

      await ctx.prisma.solicitacao.update({
        where: { id },
        data: {
          ...data,
          documento: data.documento ?? null,
        },
      });

      return { success: true };
    }),

  cancelar: solicitacaoProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const userId = currentUserId(ctx);

      const solicitacao = await ctx.prisma.solicitacao.findUnique({ where: { id: input.id } });

      if (!solicitacao || solicitacao.solicitanteId !== userId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Solicitação não encontrada." });
      }

      if (solicitacao.status !== "AGUARDANDO") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Só é possível cancelar solicitações que ainda estão aguardando aprovação.",
        });
      }

      await ctx.prisma.solicitacao.update({
        where: { id: input.id },
        data: { status: "CANCELADA" },
      });

      return { success: true };
    }),

  aprovar: solicitacaoProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      if (!hasPermission(ctx.session?.user?.permissions, "Aprovar solicitações de impressão")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const solicitacao = await ctx.prisma.solicitacao.findUnique({ where: { id: input.id } });

      if (!solicitacao) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Solicitação não encontrada." });
      }

      if (solicitacao.status !== "AGUARDANDO") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Só é possível aprovar solicitações que ainda estão aguardando aprovação.",
        });
      }

      await ctx.prisma.solicitacao.update({
        where: { id: input.id },
        data: { status: "APROVADA" },
      });

      return { success: true };
    }),

  rejeitar: solicitacaoProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      if (!hasPermission(ctx.session?.user?.permissions, "Rejeitar solicitações de impressão")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const solicitacao = await ctx.prisma.solicitacao.findUnique({ where: { id: input.id } });

      if (!solicitacao) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Solicitação não encontrada." });
      }

      if (solicitacao.status !== "AGUARDANDO") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Só é possível rejeitar solicitações que ainda estão aguardando aprovação.",
        });
      }

      await ctx.prisma.solicitacao.update({
        where: { id: input.id },
        data: { status: "REJEITADA" },
      });

      return { success: true };
    }),

  porId: solicitacaoProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const solicitacao = await ctx.prisma.solicitacao.findUnique({
        where: { id: input.id },
        include: {
          solicitante: {
            include: {
              role: true,
              department: true,
            },
          },
        },
      });

      if (!solicitacao) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Solicitação não encontrada." });
      }

      return {
        ...solicitacao,
        solicitante: {
          nome: solicitacao.solicitante.name,
          cargo: solicitacao.solicitante.role.name,
          departamento: solicitacao.solicitante.department.name,
        },
      };
    }),

  iniciarImpressao: solicitacaoProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      if (!hasPermission(ctx.session?.user?.permissions, "Executar impressão de documentos")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const solicitacao = await ctx.prisma.solicitacao.findUnique({ where: { id: input.id } });

      if (!solicitacao) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Solicitação não encontrada." });
      }

      if (solicitacao.status !== "APROVADA") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Só é possível iniciar a impressão de solicitações aprovadas.",
        });
      }

      await ctx.prisma.solicitacao.update({
        where: { id: input.id },
        data: { status: "IMPRIMINDO" },
      });

      return { success: true };
    }),

  concluirImpressao: solicitacaoProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      if (!hasPermission(ctx.session?.user?.permissions, "Executar impressão de documentos")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const solicitacao = await ctx.prisma.solicitacao.findUnique({ where: { id: input.id } });

      if (!solicitacao) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Solicitação não encontrada." });
      }

      if (solicitacao.status !== "IMPRIMINDO") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Só é possível concluir solicitações que estão em impressão.",
        });
      }

      await ctx.prisma.solicitacao.update({
        where: { id: input.id },
        data: { status: "IMPRESSA" },
      });

      return { success: true };
    }),
});
