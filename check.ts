import { PrismaClient } from "./src/generated/prisma";
import "dotenv/config";

const prisma = new PrismaClient();
async function main() {
  const permissions = await prisma.permission.findMany();
  console.log("PERMISSIONS:");
  permissions.forEach(p => console.log(p.name));

  const approvers = await prisma.user.findMany({
    where: {
      role: {
        permissions: {
          some: {
            name: "Aprovar solicitações de impressão"
          }
        }
      }
    }
  });
  console.log("APPROVERS (exact match):", approvers.map(a => a.name));

  const approvers2 = await prisma.user.findMany({
    include: {
        role: {
            include: {
                permissions: true
            }
        }
    }
  });
  const allApprovers = approvers2.filter(u => u.role.permissions.some(p => p.name === "Aprovar solicitações de impressão"));
  console.log("APPROVERS (filtered in memory):", allApprovers.map(a => a.name));

  const printers = await prisma.user.findMany({
    where: {
      role: {
        permissions: {
          some: {
            name: "Executar impressão de documentos"
          }
        }
      }
    }
  });
  console.log("PRINTERS (exact match):", printers.map(a => a.name));
}

main().catch(console.error).finally(() => prisma.$disconnect());
