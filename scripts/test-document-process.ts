import assert from "node:assert/strict";
import "dotenv/config";
import { readFile } from "fs/promises";
import path from "path";
import {
  isValidImage,
  isValidPdf,
  processDocument,
} from "../src/server/api/services/documentProcessor";
import {
  base64ToBuffer,
  bufferToBase64,
} from "../src/server/api/services/documentConverter";
import { prisma } from "../src/lib/prisma";

const root = path.resolve(__dirname);
const fixtures = path.join(root, "fixtures");

type ExpectedFile = {
  filename: string;
  mimeType: "application/pdf" | "image/png" | "image/jpeg";
  pages?: number;
  width?: number;
  height?: number;
  dpi?: number;
};

const expectedFiles: ExpectedFile[] = [
  { filename: "prova1.pdf", mimeType: "application/pdf", pages: 14 },
  { filename: "prova2.pdf", mimeType: "application/pdf", pages: 7 },
  {
    filename: "provaFake.pdf",
    mimeType: "image/png",
    width: 600,
    height: 776,
    dpi: 1829,
  },
  {
    filename: "prova3.png",
    mimeType: "image/png",
    width: 1190,
    height: 1682,
    dpi: 144,
  },
];

async function testFile(expected: ExpectedFile) {
  const { filename } = expected;
  const filePath = path.join(fixtures, filename);
  const buffer = await readFile(filePath);

  console.log("=== Testando:", filename);
  console.log("Tamanho:", buffer.length, "bytes");

  const result = await processDocument(buffer, filename);
  console.log("processDocument:", result);

  assert.equal(result.mimeType, expected.mimeType);
  assert.equal(result.fileSize, buffer.length);
  assert.equal(result.metadata.pages, expected.pages);
  assert.equal(result.metadata.width, expected.width);
  assert.equal(result.metadata.height, expected.height);
  assert.equal(result.metadata.dpi, expected.dpi);

  if (result.mimeType === "application/pdf") {
    const validPdf = await isValidPdf(buffer);
    console.log("isValidPdf:", validPdf);
    assert.equal(validPdf, true);
  } else {
    const validImage = await isValidImage(buffer);
    console.log("isValidImage:", validImage);
    assert.equal(validImage, true);
  }

  const base64 = bufferToBase64(buffer);
  const restored = base64ToBuffer(base64);

  console.log("base64 length:", base64.length);
  console.log("restored buffer length:", restored.length);
  console.log("buffer equality:", restored.equals(buffer));
  assert.equal(restored.equals(buffer), true);
  console.log("");
}

async function testInvalidPdf() {
  const fakePdf = Buffer.from("%PDF not a real pdf");

  console.log("=== Testando PDF invalido");
  assert.equal(await isValidPdf(fakePdf), false);

  await assert.rejects(
    () => processDocument(fakePdf, "fake.pdf"),
    /PDF.*corrompido/
  );
  console.log("");
}

async function getOrCreateTestUser() {
  const existingUser = await prisma.user.findFirst({
    select: { id: true },
  });

  if (existingUser) {
    return {
      userId: existingUser.id,
      cleanup: async () => {},
    };
  }

  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const role = await prisma.role.create({
    data: { name: `Teste documentos ${suffix}` },
  });
  const department = await prisma.department.create({
    data: { name: `Teste documentos ${suffix}` },
  });
  const user = await prisma.user.create({
    data: {
      name: "Usuario teste documentos",
      email: `teste-documentos-${suffix}@example.com`,
      password: "test-only",
      roleId: role.id,
      departmentId: department.id,
    },
  });

  return {
    userId: user.id,
    cleanup: async () => {
      await prisma.user.delete({ where: { id: user.id } });
      await prisma.role.delete({ where: { id: role.id } });
      await prisma.department.delete({ where: { id: department.id } });
    },
  };
}

async function testPersistedPdfFromDatabase() {
  const expected = expectedFiles.find((file) => file.filename === "prova2.pdf");
  assert.ok(expected);

  const filePath = path.join(fixtures, expected.filename);
  const buffer = await readFile(filePath);
  const processed = await processDocument(buffer, expected.filename);
  const { userId, cleanup } = await getOrCreateTestUser();
  let documentId: string | undefined;

  console.log("=== Testando gravacao e recuperacao do banco:", expected.filename);

  try {
    const created = await prisma.document.create({
      data: {
        filename: expected.filename,
        mimeType: processed.mimeType,
        fileSize: processed.fileSize,
        data: new Uint8Array(buffer),
        metadata: processed.metadata as any,
        createdById: userId,
      },
    });
    documentId = created.id;

    const saved = await prisma.document.findUnique({
      where: { id: created.id },
    });

    assert.ok(saved);
    assert.equal(saved.id, created.id);
    assert.equal(saved.filename, expected.filename);
    assert.equal(saved.mimeType, expected.mimeType);
    assert.equal(saved.fileSize, buffer.length);
    assert.deepEqual(saved.metadata, processed.metadata);
    assert.equal(Buffer.from(saved.data).equals(buffer), true);

    console.log("document id:", saved.id);
    console.log("metadata recuperado:", saved.metadata);
    console.log("buffer recuperado igual:", Buffer.from(saved.data).equals(buffer));
    console.log("");
  } finally {
    if (documentId) {
      await prisma.document.delete({ where: { id: documentId } });
    }
    await cleanup();
  }
}

async function main() {
  const failures: Array<{ filename: string; error: unknown }> = [];

  for (const expected of expectedFiles) {
    try {
      await testFile(expected);
    } catch (error) {
      failures.push({ filename: expected.filename, error });
      console.error(`Erro ao testar ${expected.filename}:`, error);
    }
  }

  try {
    await testInvalidPdf();
  } catch (error) {
    failures.push({ filename: "fake.pdf", error });
    console.error("Erro ao testar fake.pdf:", error);
  }

  try {
    await testPersistedPdfFromDatabase();
  } catch (error) {
    failures.push({ filename: "database:prova2.pdf", error });
    console.error("Erro ao testar gravação/recuperação no banco:", error);
  }

  if (failures.length > 0) {
    throw new Error(`${failures.length} teste(s) falharam`);
  }

  console.log("Todos os testes passaram.");
}

main()
  .catch((error) => {
    console.error("Erro no script de teste:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
