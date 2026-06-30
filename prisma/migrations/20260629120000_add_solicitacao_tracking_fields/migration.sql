-- AlterTable
ALTER TABLE "Solicitacao" ADD COLUMN     "aprovadorId" INTEGER,
ADD COLUMN     "decididoEm" TIMESTAMP(3),
ADD COLUMN     "impressorId" INTEGER,
ADD COLUMN     "folhasPerdidas" INTEGER NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE "Solicitacao" ADD CONSTRAINT "Solicitacao_aprovadorId_fkey" FOREIGN KEY ("aprovadorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Solicitacao" ADD CONSTRAINT "Solicitacao_impressorId_fkey" FOREIGN KEY ("impressorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
