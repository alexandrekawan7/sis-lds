/**
 * Serviço para conversão de buffers e base64
 */

/**
 * Converte um Buffer para string base64
 * @param buffer Buffer a ser convertido
 * @returns String em formato base64
 */
export function bufferToBase64(buffer: Buffer | Uint8Array): string {
  return Buffer.from(buffer).toString("base64");
}

/**
 * Converte uma string base64 para Buffer
 * @param base64String String em formato base64
 * @returns Buffer decodificado
 */
export function base64ToBuffer(base64String: string): Buffer {
  return Buffer.from(base64String, "base64");
}

/**
 * Valida se uma string é um base64 válido
 * @param str String a validar
 * @returns true se for base64 válido
 */
export function isValidBase64(str: string): boolean {
  try {
    return Buffer.from(str, "base64").toString("base64") === str;
  } catch (err) {
    return false;
  }
}

/**
 * Obtém o MIME type de um base64 com data URI
 * @param dataUri Data URI string (data:image/png;base64,...)
 * @returns MIME type ou null
 */
export function getMimeTypeFromDataUri(dataUri: string): string | null {
  const match = dataUri.match(/^data:([^;]+);base64,/);
  return match ? match[1] : null;
}

/**
 * Cria um data URI de uma string base64 e MIME type
 * @param base64String String base64
 * @param mimeType MIME type (ex: image/png)
 * @returns Data URI string
 */
export function createDataUri(base64String: string, mimeType: string): string {
  return `data:${mimeType};base64,${base64String}`;
}
