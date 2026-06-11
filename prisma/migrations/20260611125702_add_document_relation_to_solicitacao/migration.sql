/*
  Warnings:

  - You are about to drop the `PrintRequest` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PrintRequest" DROP CONSTRAINT "PrintRequest_approvedById_fkey";

-- DropForeignKey
ALTER TABLE "PrintRequest" DROP CONSTRAINT "PrintRequest_documentId_fkey";

-- DropForeignKey
ALTER TABLE "PrintRequest" DROP CONSTRAINT "PrintRequest_requestedById_fkey";

-- AlterTable
ALTER TABLE "Solicitacao" ADD COLUMN     "documentId" TEXT;

-- DropTable
DROP TABLE "PrintRequest";

-- AddForeignKey
ALTER TABLE "Solicitacao" ADD CONSTRAINT "Solicitacao_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;
