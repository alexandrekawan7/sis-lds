/**
 * Serviço para processamento e extração de metadados de documentos
 */

// @ts-ignore - pdf-parse não tem tipos exportados

import sharp from "sharp";
import type {
  DocumentMetadata,
  ProcessedDocumentData,
} from "../types/document";
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  ALLOWED_FILE_EXTENSIONS,
} from "../schemas/document";

type PdfParser = {
  getInfo: () => Promise<{ total?: number }>;
  destroy: () => Promise<void> | void;
};

/**
 * Detecta o MIME type baseado no conteúdo do arquivo (magic bytes)
 * @param buffer Buffer do arquivo
 * @returns MIME type ou null se não detectado
 */
export function detectMimeTypeByMagicBytes(buffer: Buffer): string | null {
  if (buffer.length < 4) return null;

  // PDF: %PDF
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return "application/pdf";
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  // PNG: 89 50 4E 47
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }

  return null;
}

/**
 * Detecta MIME type pela extensão do arquivo
 * @param filename Nome do arquivo
 * @returns MIME type ou null
 */
export function detectMimeTypeByExtension(filename: string): string | null {
  const ext = filename.substring(filename.lastIndexOf(".")).toLowerCase();

  switch (ext) {
    case ".pdf":
      return "application/pdf";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    default:
      return null;
  }
}

/**
 * Extrai metadados de um arquivo PDF
 * @param buffer Buffer do arquivo PDF
 * @returns Objeto com metadados do PDF
 */
export async function extractPdfMetadata(
  buffer: Buffer
): Promise<DocumentMetadata> {
  let parser: PdfParser | undefined;

  try {
    const { PDFParse } = require("pdf-parse");
    const currentParser: PdfParser = new PDFParse({ data: buffer });
    parser = currentParser;
    const pdfData = await currentParser.getInfo();

    return {
      pages: pdfData.total,
    };
  } catch {
    return {};
  } finally {
    try {
      await parser?.destroy();
    } catch (error) {
      console.error("Erro ao liberar parser PDF:", error);
    }
  }
}

/**
 * Extrai metadados de um arquivo de imagem
 * @param buffer Buffer do arquivo de imagem
 * @returns Objeto com metadados da imagem
 */
export async function extractImageMetadata(
  buffer: Buffer
): Promise<DocumentMetadata> {
  try {
    const image = sharp(buffer);
    const metadata = await image.metadata();

    return {
      width: metadata.width,
      height: metadata.height,
      dpi: metadata.density,
    };
  } catch {
    return {};
  }
}

/**
 * Processa um documento e extrai seus metadados
 * @param buffer Buffer do arquivo
 * @param filename Nome do arquivo
 * @returns Dados processados do documento (mimeType, fileSize, metadata)
 * @throws Error se o arquivo for inválido
 */
export async function processDocument(
  buffer: Buffer,
  filename: string
): Promise<ProcessedDocumentData> {
  // Validação: Tamanho máximo
  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error(
      `Arquivo excede o tamanho máximo de ${MAX_FILE_SIZE / (1024 * 1024)}MB`
    );
  }

  // Validação: Extensão do arquivo
  const ext = filename.substring(filename.lastIndexOf(".")).toLowerCase();
  if (!ALLOWED_FILE_EXTENSIONS.includes(ext)) {
    throw new Error(
      `Extensão de arquivo não permitida. Aceitos: ${ALLOWED_FILE_EXTENSIONS.join(", ")}`
    );
  }

  // Detectar MIME type (priority: magic bytes > extensão)
  let mimeType =
    detectMimeTypeByMagicBytes(buffer) ||
    detectMimeTypeByExtension(filename);

  if (!mimeType) {
    throw new Error(
      "Não foi possível detectar o tipo de arquivo. Certifique-se de que é um PDF ou imagem (JPG, PNG) válido."
    );
  }

  // Validação: MIME type permitido
  if (!ALLOWED_MIME_TYPES.includes(mimeType as typeof ALLOWED_MIME_TYPES[number])) {
    throw new Error(
      `Tipo de arquivo não permitido: ${mimeType}. Aceitos: ${ALLOWED_MIME_TYPES.join(", ")}`
    );
  }

  // Extrair metadados apropriados
  let metadata: DocumentMetadata = {};

  if (mimeType === "application/pdf") {
    metadata = await extractPdfMetadata(buffer);
    const pages = metadata.pages;
    if (typeof pages !== "number" || !Number.isInteger(pages) || pages < 1) {
      throw new Error("PDF inválido ou corrompido.");
    }
  } else if (mimeType === "image/jpeg" || mimeType === "image/png") {
    metadata = await extractImageMetadata(buffer);
    if (!metadata.width || !metadata.height) {
      throw new Error("Imagem inválida ou corrompida.");
    }
  }

  return {
    mimeType,
    fileSize: buffer.length,
    metadata,
  };
}

/**
 * Valida se um buffer é um PDF válido
 * @param buffer Buffer a validar
 * @returns true se for um PDF válido
 */
export async function isValidPdf(buffer: Buffer): Promise<boolean> {
  let parser: PdfParser | undefined;

  try {
    if (
      buffer.length < 4 ||
      buffer[0] !== 0x25 ||
      buffer[1] !== 0x50 ||
      buffer[2] !== 0x44 ||
      buffer[3] !== 0x46
    ) {
      return false;
    }

    const { PDFParse } = require("pdf-parse");
    const currentParser: PdfParser = new PDFParse({ data: buffer });
    parser = currentParser;
    const pdfData = await currentParser.getInfo();
    const totalPages = pdfData.total;

    return (
      typeof totalPages === "number" &&
      Number.isInteger(totalPages) &&
      totalPages > 0
    );
  } catch {
    return false;
  } finally {
    try {
      await parser?.destroy();
    } catch {
      return false;
    }
  }
}

/**
 * Valida se um buffer é uma imagem válida
 * @param buffer Buffer a validar
 * @returns true se for uma imagem válida
 */
export async function isValidImage(buffer: Buffer): Promise<boolean> {
  try {
    const image = sharp(buffer);
    await image.metadata();
    return true;
  } catch {
    return false;
  }
}

/**
 * Obtém informações formatadas sobre o documento
 * @param buffer Buffer do documento
 * @param filename Nome do arquivo
 * @returns String com informações legíveis sobre o documento
 */
export async function getDocumentInfo(
  buffer: Buffer,
  filename: string
): Promise<string> {
  try {
    const processed = await processDocument(buffer, filename);

    let info = `Arquivo: ${filename}\n`;
    info += `Tipo: ${processed.mimeType}\n`;
    info += `Tamanho: ${(processed.fileSize / 1024).toFixed(2)} KB\n`;

    if (processed.metadata.pages) {
      info += `Páginas: ${processed.metadata.pages}\n`;
    }

    if (processed.metadata.width && processed.metadata.height) {
      info += `Dimensões: ${processed.metadata.width}x${processed.metadata.height}px\n`;
    }

    if (processed.metadata.dpi) {
      info += `DPI: ${processed.metadata.dpi}\n`;
    }

    return info;
  } catch (error) {
    return `Erro ao processar documento: ${
      error instanceof Error ? error.message : "Erro desconhecido"
    }`;
  }
}
