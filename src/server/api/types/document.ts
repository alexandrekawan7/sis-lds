/**
 * Tipos para o módulo de documentos para impressão
 */

export interface DocumentMetadata {
  pages?: number; // Número de páginas (PDF)
  width?: number; // Largura em pixels (imagem)
  height?: number; // Altura em pixels (imagem)
  dpi?: number; // DPI/densidade (imagem)
}

export interface DocumentResponse {
  id: string;
  filename: string;
  mimeType: string;
  fileSize: number;
  metadata: DocumentMetadata;
  base64Data: string;
  createdAt: Date;
}

export interface DocumentMetadataResponse {
  id: string;
  filename: string;
  mimeType: string;
  fileSize: number;
  metadata: DocumentMetadata;
  createdAt: Date;
  createdById: number;
}

export interface PrintRequestResponse {
  id: string;
  documentId: string;
  requestedById: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "PRINTED" | "FAILED";
  copies: number;
  notes?: string | null;
  approvedById?: number | null;
  approvalNotes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  document?: DocumentMetadataResponse;
  requestedBy?: {
    id: number;
    name: string;
    email: string;
  };
  approvedBy?: {
    id: number;
    name: string;
    email: string;
  } | null;
}

export interface UploadDocumentInput {
  fileBuffer: Buffer;
  filename: string;
}

export interface ProcessedDocumentData {
  mimeType: string;
  fileSize: number;
  metadata: DocumentMetadata;
}
