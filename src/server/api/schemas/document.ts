/**
 * Validacoes Zod para o modulo de documentos para impressao
 */

import { z } from "zod";

// MIME types permitidos
export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
] as const;

export const ALLOWED_FILE_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png"];

// Tamanho maximo de arquivo (50MB)
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

const fileBufferSchema = z
  .union([z.instanceof(Buffer), z.string().min(1)])
  .transform((value, ctx) => {
    if (Buffer.isBuffer(value)) {
      return value;
    }

    const base64 = value.includes(",")
      ? value.substring(value.indexOf(",") + 1)
      : value;
    const normalized = base64.replace(/\s/g, "");
    const buffer = Buffer.from(normalized, "base64");

    if (buffer.length === 0 || buffer.toString("base64") !== normalized) {
      ctx.addIssue({
        code: "custom",
        message: "Arquivo deve ser enviado como Buffer ou base64 valido",
      });
    }

    return buffer;
  })
  .refine((buf) => buf.length <= MAX_FILE_SIZE, {
    message: `Arquivo excede o tamanho maximo de ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
  });

// Schemas de entrada
export const uploadDocumentSchema = z.object({
  fileBuffer: fileBufferSchema,
  filename: z
    .string()
    .min(1, "Filename e obrigatorio")
    .refine((filename) => {
      const ext = filename.substring(filename.lastIndexOf(".")).toLowerCase();
      return ALLOWED_FILE_EXTENSIONS.includes(ext);
    }, "Extensao de arquivo nao permitida. Aceitos: PDF, JPG, PNG"),
});

export const listDocumentsSchema = z.object({
  userId: z.number().int().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export const getDocumentSchema = z.object({
  documentId: z.string().uuid("ID de documento invalido"),
});

export const createPrintRequestSchema = z.object({
  documentId: z.string().uuid("ID de documento invalido"),
  copies: z
    .number()
    .int()
    .min(1, "Minimo de 1 copia")
    .max(999, "Maximo de 999 copias")
    .default(1),
  notes: z.string().max(500).optional(),
});

export const listPrintRequestsSchema = z.object({
  status: z
    .enum(["PENDING", "APPROVED", "REJECTED", "PRINTED", "FAILED"])
    .optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  documentId: z.string().uuid().optional(),
  requestedById: z.number().int().optional(),
});

export const updatePrintRequestStatusSchema = z.object({
  printRequestId: z.string().uuid("ID de solicitacao invalido"),
  newStatus: z.enum(["APPROVED", "REJECTED", "PRINTED", "FAILED"]),
  approvalNotes: z.string().max(500).optional(),
});

export const getPrintRequestSchema = z.object({
  printRequestId: z.string().uuid("ID de solicitacao invalido"),
});

// Schemas de resposta
export const documentMetadataSchema = z
  .object({
    pages: z.number().int().optional(),
    width: z.number().int().optional(),
    height: z.number().int().optional(),
    dpi: z.number().optional(),
  })
  .passthrough();

export const documentResponseSchema = z.object({
  id: z.string().uuid(),
  filename: z.string(),
  mimeType: z.string(),
  fileSize: z.number(),
  metadata: documentMetadataSchema,
  base64Data: z.string(),
  createdAt: z.date(),
});

export const printRequestResponseSchema = z.object({
  id: z.string().uuid(),
  documentId: z.string().uuid(),
  requestedById: z.number(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "PRINTED", "FAILED"]),
  copies: z.number().int(),
  notes: z.string().nullable().optional(),
  approvedById: z.number().nullable().optional(),
  approvalNotes: z.string().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Tipos derivados do Zod
export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;
export type ListDocumentsInput = z.infer<typeof listDocumentsSchema>;
export type GetDocumentInput = z.infer<typeof getDocumentSchema>;
export type CreatePrintRequestInput = z.infer<typeof createPrintRequestSchema>;
export type ListPrintRequestsInput = z.infer<typeof listPrintRequestsSchema>;
export type UpdatePrintRequestStatusInput = z.infer<
  typeof updatePrintRequestStatusSchema
>;
export type GetPrintRequestInput = z.infer<typeof getPrintRequestSchema>;
export type DocumentMetadata = z.infer<typeof documentMetadataSchema>;
export type DocumentResponse = z.infer<typeof documentResponseSchema>;
export type PrintRequestResponse = z.infer<typeof printRequestResponseSchema>;
