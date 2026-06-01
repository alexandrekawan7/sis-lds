/**
 * Router tRPC para gerenciamento de documentos
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
          "Visualizar todas as solicitações de impressão"
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
            _count: { select: { solicitacoes: true } },
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

        if (document._count.solicitacoes > 0) {
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
