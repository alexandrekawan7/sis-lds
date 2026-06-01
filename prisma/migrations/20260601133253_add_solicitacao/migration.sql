-- CreateEnum
CREATE TYPE "SolicitacaoStatus" AS ENUM ('AGUARDANDO', 'APROVADA', 'REJEITADA', 'CONCLUIDA', 'CANCELADA');

-- CreateTable
CREATE TABLE "Solicitacao" (
    "id" SERIAL NOT NULL,
    "tipoPapel" TEXT NOT NULL,
    "intuito" TEXT NOT NULL,
    "copias" INTEGER NOT NULL,
    "tamanho" TEXT NOT NULL,
    "orientacao" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "cor" TEXT NOT NULL,
    "acabamento" TEXT NOT NULL,
    "documento" TEXT,
    "dataRetirada" TEXT NOT NULL,
    "horarioRetirada" TEXT NOT NULL,
    "status" "SolicitacaoStatus" NOT NULL DEFAULT 'AGUARDANDO',
    "solicitanteId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Solicitacao_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Solicitacao" ADD CONSTRAINT "Solicitacao_solicitanteId_fkey" FOREIGN KEY ("solicitanteId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
