/**
 * Router tRPC para gerenciamento de documentos e solicitações de impressão
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
  uploadDocumentSchema,
  listDocumentsSchema,
  getDocumentSchema,
  createPrintRequestSchema,
  listPrintRequestsSchema,
  updatePrintRequestStatusSchema,
} from "@/server/api/schemas/document";
import {
  processDocument,
} from "@/server/api/services/documentProcessor";
import {
  bufferToBase64,
} from "@/server/api/services/documentConverter";
import { PermissionName } from "@/lib/permissions";

export const documentRouter = createTRPCRouter({
  /**
   * Upload de documento com extração de metadados
   */
  uploadDocument: protectedProcedure
    .input(uploadDocumentSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Você precisa estar autenticado",
        });
      }

      try {
        // Processar e validar documento
        const processedData = await processDocument(
          input.fileBuffer,
          input.filename
        );

        // Salvar no banco
        const userId = Number(ctx.session.user.id);
        const document = await ctx.prisma.document.create({
          data: {
            filename: input.filename,
            mimeType: processedData.mimeType,
            fileSize: processedData.fileSize,
            data: new Uint8Array(input.fileBuffer),
            metadata: processedData.metadata as any,
            createdById: userId,
          },
        });

        return {
          id: document.id,
          filename: document.filename,
          mimeType: document.mimeType,
          fileSize: document.fileSize,
          metadata: document.metadata,
          createdAt: document.createdAt,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        if (error instanceof Error) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message,
          });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao fazer upload",
        });
      }
    }),

  /**
   * Obter documento com base64 encoded
   */
  getDocumentWithBase64: protectedProcedure
    .input(getDocumentSchema)
    .query(async ({ ctx, input }) => {
      try {
        const document = await ctx.prisma.document.findUnique({
          where: { id: input.documentId },
        });

        if (!document) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Documento não encontrado",
          });
        }

        const base64Data = bufferToBase64(document.data as unknown as Buffer);

        return {
          id: document.id,
          filename: document.filename,
          mimeType: document.mimeType,
          fileSize: document.fileSize,
          metadata: document.metadata,
          base64Data,
          createdAt: document.createdAt,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao obter documento",
        });
      }
    }),

  /**
   * Listar documentos com paginação
   */
  listDocuments: protectedProcedure
    .input(listDocumentsSchema)
    .query(async ({ ctx, input }) => {
      try {
        const userId = Number(ctx.session?.user?.id);
        const canViewAll = ctx.session?.user?.permissions?.includes(
          "Visualizar todas as solicitacoes de impressao"
        );

        const whereClause = canViewAll ? {} : { createdById: userId };

        const [documents, total] = await Promise.all([
          ctx.prisma.document.findMany({
            where: whereClause,
            skip: input.offset,
            take: input.limit,
            orderBy: { createdAt: "desc" },
          }),
          ctx.prisma.document.count({ where: whereClause }),
        ]);

        return {
          documents: documents.map((doc) => ({
            id: doc.id,
            filename: doc.filename,
            mimeType: doc.mimeType,
            fileSize: doc.fileSize,
            metadata: doc.metadata,
            createdAt: doc.createdAt,
            createdById: doc.createdById,
          })),
          total,
          limit: input.limit,
          offset: input.offset,
          hasMore: input.offset + input.limit < total,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao listar documentos",
        });
      }
    }),

  /**
   * Criar solicitação de impressão
   */
  createPrintRequest: protectedProcedure
    .input(createPrintRequestSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        const userId = Number(ctx.session.user.id);

        // Verificar se documento existe
        const document = await ctx.prisma.document.findUnique({
          where: { id: input.documentId },
        });

        if (!document) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Documento não encontrado",
          });
        }

        // Criar solicitação
        const printRequest = await ctx.prisma.printRequest.create({
          data: {
            documentId: input.documentId,
            requestedById: userId,
            copies: input.copies,
            notes: input.notes,
            status: "PENDING",
          },
          include: {
            document: {
              select: {
                id: true,
                filename: true,
                mimeType: true,
                fileSize: true,
                metadata: true,
              },
            },
            requestedBy: {
              select: { id: true, name: true, email: true },
            },
          },
        });

        return {
          id: printRequest.id,
          documentId: printRequest.documentId,
          requestedById: printRequest.requestedById,
          status: printRequest.status,
          copies: printRequest.copies,
          notes: printRequest.notes,
          createdAt: printRequest.createdAt,
          document: printRequest.document,
          requestedBy: printRequest.requestedBy,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao criar solicitação de impressão",
        });
      }
    }),

  /**
   * Listar solicitações de impressão
   */
  listPrintRequests: protectedProcedure
    .input(listPrintRequestsSchema)
    .query(async ({ ctx, input }) => {
      try {
        const userId = Number(ctx.session?.user?.id);
        const canViewAll = ctx.session?.user?.permissions?.includes(
          "Visualizar todas as solicitacoes de impressao"
        );
        const canViewOwn = ctx.session?.user?.permissions?.includes(
          "Visualizar as proprias solicitacoes de impressao"
        );

        if (!canViewAll && !canViewOwn) {
          return {
            requests: [],
            total: 0,
            limit: input.limit,
            offset: input.offset,
            hasMore: false,
          };
        }

        const whereClause: any = {};

        if (input.status) {
          whereClause.status = input.status;
        }

        if (input.documentId) {
          whereClause.documentId = input.documentId;
        }

        if (!canViewAll) {
          whereClause.requestedById = userId;
        }

        const [requests, total] = await Promise.all([
          ctx.prisma.printRequest.findMany({
            where: whereClause,
            skip: input.offset,
            take: input.limit,
            orderBy: { createdAt: "desc" },
            include: {
              document: {
                select: {
                  id: true,
                  filename: true,
                  mimeType: true,
                  fileSize: true,
                },
              },
              requestedBy: {
                select: { id: true, name: true, email: true },
              },
              approvedBy: {
                select: { id: true, name: true, email: true },
              },
            },
          }),
          ctx.prisma.printRequest.count({ where: whereClause }),
        ]);

        return {
          requests: requests.map((req) => ({
            id: req.id,
            documentId: req.documentId,
            requestedById: req.requestedById,
            status: req.status,
            copies: req.copies,
            notes: req.notes,
            approvedById: req.approvedById,
            createdAt: req.createdAt,
            updatedAt: req.updatedAt,
            document: req.document,
            requestedBy: req.requestedBy,
            approvedBy: req.approvedBy,
          })),
          total,
          limit: input.limit,
          offset: input.offset,
          hasMore: input.offset + input.limit < total,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao listar solicitações",
        });
      }
    }),

  /**
   * Obter uma solicitação de impressão
   */
  getPrintRequest: protectedProcedure
    .input(z.object({ printRequestId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      try {
        const userId = Number(ctx.session?.user?.id);
        const canViewAll = ctx.session?.user?.permissions?.includes(
          "Visualizar todas as solicitacoes de impressao"
        );

        const printRequest = await ctx.prisma.printRequest.findUnique({
          where: { id: input.printRequestId },
          include: {
            document: {
              select: {
                id: true,
                filename: true,
                mimeType: true,
                fileSize: true,
              },
            },
            requestedBy: {
              select: { id: true, name: true, email: true },
            },
            approvedBy: {
              select: { id: true, name: true, email: true },
            },
          },
        });

        if (!printRequest) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Solicitação não encontrada",
          });
        }

        if (!canViewAll && printRequest.requestedById !== userId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Acesso negado",
          });
        }

        return {
          id: printRequest.id,
          documentId: printRequest.documentId,
          requestedById: printRequest.requestedById,
          status: printRequest.status,
          copies: printRequest.copies,
          notes: printRequest.notes,
          approvedById: printRequest.approvedById,
          createdAt: printRequest.createdAt,
          updatedAt: printRequest.updatedAt,
          document: printRequest.document,
          requestedBy: printRequest.requestedBy,
          approvedBy: printRequest.approvedBy,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao obter solicitação",
        });
      }
    }),

  /**
   * Atualizar status de solicitação de impressão
   */
  updatePrintRequestStatus: protectedProcedure
    .input(updatePrintRequestStatusSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        const userId = Number(ctx.session.user.id);
        const permissions = ctx.session.user.permissions as PermissionName[] || [];

        // Verificar permissão baseada no status
        const statusPermissionMap: Record<
          "APPROVED" | "REJECTED" | "PRINTED" | "FAILED",
          PermissionName
        > = {
          APPROVED: "Aprovar solicitacoes de impressao",
          REJECTED: "Rejeitar solicitacoes de impressao",
          PRINTED: "Executar impressao de documentos",
          FAILED: "Executar impressao de documentos",
        };

        const requiredPermission = statusPermissionMap[input.newStatus];
        if (!permissions.includes(requiredPermission)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `Permissão necessária: ${requiredPermission}`,
          });
        }

        // Buscar solicitação
        const existingRequest = await ctx.prisma.printRequest.findUnique({
          where: { id: input.printRequestId },
        });

        if (!existingRequest) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Solicitação não encontrada",
          });
        }

        // Validar transição de status
        const validTransitions: Record<string, string[]> = {
          PENDING: ["APPROVED", "REJECTED"],
          APPROVED: ["PRINTED", "FAILED"],
          REJECTED: [],
          PRINTED: [],
          FAILED: ["APPROVED"],
        };

        if (!validTransitions[existingRequest.status]?.includes(input.newStatus)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Transição inválida de ${existingRequest.status} para ${input.newStatus}`,
          });
        }

        // Atualizar
        const updated = await ctx.prisma.printRequest.update({
          where: { id: input.printRequestId },
          data: {
            status: input.newStatus,
            approvedById:
              input.newStatus === "APPROVED" ? userId : existingRequest.approvedById,
            approvalNotes: input.approvalNotes,
          },
          include: {
            document: {
              select: {
                id: true,
                filename: true,
                mimeType: true,
                fileSize: true,
              },
            },
            requestedBy: {
              select: { id: true, name: true, email: true },
            },
            approvedBy: {
              select: { id: true, name: true, email: true },
            },
          },
        });

        return {
          id: updated.id,
          documentId: updated.documentId,
          requestedById: updated.requestedById,
          status: updated.status,
          copies: updated.copies,
          notes: updated.notes,
          approvedById: updated.approvedById,
          approvalNotes: updated.approvalNotes,
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt,
          document: updated.document,
          requestedBy: updated.requestedBy,
          approvedBy: updated.approvedBy,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao atualizar solicitação",
        });
      }
    }),

  /**
   * Deletar documento
   */
  deleteDocument: protectedProcedure
    .input(getDocumentSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        const userId = Number(ctx.session.user.id);

        const document = await ctx.prisma.document.findUnique({
          where: { id: input.documentId },
          include: {
            _count: { select: { printRequests: true } },
          },
        });

        if (!document) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Documento não encontrado",
          });
        }

        if (document.createdById !== userId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Você só pode deletar seus próprios documentos",
          });
        }

        if (document._count.printRequests > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Não é possível deletar documentos com solicitações associadas",
          });
        }

        await ctx.prisma.document.delete({
          where: { id: input.documentId },
        });

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao deletar documento",
        });
      }
    }),
});
