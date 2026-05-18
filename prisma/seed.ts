import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";
import { MANAGE_USERS_PERMISSION, SYSTEM_PERMISSIONS } from "../src/lib/permissions";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const PERMISSION_LABELS = {
  manageUsers: MANAGE_USERS_PERMISSION,
  createPrintRequest: "Criar solicitacoes de impressao",
  viewOwnPrintRequests: "Visualizar as proprias solicitacoes de impressao",
  viewAllPrintRequests: "Visualizar todas as solicitacoes de impressao",
  approvePrintRequests: "Aprovar solicitacoes de impressao",
  rejectPrintRequests: "Rejeitar solicitacoes de impressao",
  executePrinting: "Executar impressao de documentos",
  viewReports: "Visualizar e exportar relatorios de folhas",
} as const;

const PERMISSIONS: Array<{ name: string; description: string }> = [
  {
    name: PERMISSION_LABELS.manageUsers,
    description: "Permite criar, editar e excluir usuarios do sistema.",
  },
  {
    name: PERMISSION_LABELS.createPrintRequest,
    description: "Permite registrar novas solicitacoes de impressao.",
  },
  {
    name: PERMISSION_LABELS.viewOwnPrintRequests,
    description: "Permite visualizar apenas as solicitacoes criadas pelo proprio usuario.",
  },
  {
    name: PERMISSION_LABELS.viewAllPrintRequests,
    description: "Permite visualizar todas as solicitacoes de impressao da instituicao.",
  },
  {
    name: PERMISSION_LABELS.approvePrintRequests,
    description: "Permite aprovar solicitacoes de impressao pendentes.",
  },
  {
    name: PERMISSION_LABELS.rejectPrintRequests,
    description: "Permite rejeitar solicitacoes de impressao pendentes.",
  },
  {
    name: PERMISSION_LABELS.executePrinting,
    description: "Permite executar a impressao fisica dos documentos aprovados.",
  },
  {
    name: PERMISSION_LABELS.viewReports,
    description: "Permite visualizar e exportar relatorios de uso de folhas.",
  },
];

type RoleTemplate = {
  name: string;
  permissionNames: string[];
};

function mergeRoleTemplates(templates: RoleTemplate[]) {
  const byRole = new Map<string, Set<string>>();

  for (const template of templates) {
    if (!template.name?.trim()) continue;

    const roleName = template.name.trim();
    const current = byRole.get(roleName) ?? new Set<string>();

    for (const permissionName of template.permissionNames) {
      current.add(permissionName);
    }

    byRole.set(roleName, current);
  }

  return [...byRole.entries()].map(([name, permissions]) => ({
    name,
    permissionNames: [...permissions],
  }));
}

async function main(): Promise<void> {
  const adminRole = process.env.ADMIN_ROLE?.trim() || "Administrador";
  const adminDepartment = process.env.ADMIN_DEPARTMENT?.trim() || "Administracao";

  const roleTemplates = mergeRoleTemplates([
    {
      name: adminRole,
      permissionNames: [...SYSTEM_PERMISSIONS],
    },
    {
      name: "Professor",
      permissionNames: [
        PERMISSION_LABELS.createPrintRequest,
        PERMISSION_LABELS.viewOwnPrintRequests,
      ],
    },
    {
      name: "Coordenador",
      permissionNames: [
        PERMISSION_LABELS.createPrintRequest,
        PERMISSION_LABELS.viewOwnPrintRequests,
        PERMISSION_LABELS.viewAllPrintRequests,
        PERMISSION_LABELS.approvePrintRequests,
        PERMISSION_LABELS.rejectPrintRequests,
        PERMISSION_LABELS.viewReports,
      ],
    },
    {
      name: "Impressor",
      permissionNames: [
        PERMISSION_LABELS.viewAllPrintRequests,
        PERMISSION_LABELS.executePrinting,
      ],
    },
    {
      name: "Convidado",
      permissionNames: [PERMISSION_LABELS.viewReports],
    },
  ]);

  const departmentNames = [
    adminDepartment,
    "Matematica",
    "Fisica",
    "Engenharia Eletrica",
    "Engenharia Mecanica",
    "Sistemas de Informacao",
  ];

  const uniqueDepartmentNames = [...new Set(departmentNames.filter(Boolean))];

  const permissions = await Promise.all(
    PERMISSIONS.map(({ name }) =>
      prisma.permission.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    )
  );

  const byPermissionName = Object.fromEntries(permissions.map((permission) => [permission.name, permission]));

  const roles = await Promise.all(
    roleTemplates.map((template) =>
      prisma.role.upsert({
        where: { name: template.name },
        update: {},
        create: { name: template.name },
      })
    )
  );

  for (const role of roles) {
    const template = roleTemplates.find((item) => item.name === role.name);
    const permissionIds = (template?.permissionNames ?? [])
      .map((permissionName) => byPermissionName[permissionName]?.id)
      .filter((id): id is number => Boolean(id));

    await prisma.role.update({
      where: { id: role.id },
      data: {
        permissions: {
          set: permissionIds.map((id) => ({ id })),
        },
      },
    });
  }

  const departments = await Promise.all(
    uniqueDepartmentNames.map((name) =>
      prisma.department.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    )
  );

  const byRoleName = Object.fromEntries(roles.map((role) => [role.name, role]));
  const byDepartmentName = Object.fromEntries(
    departments.map((department) => [department.name, department])
  );

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error("ADMIN_EMAIL e ADMIN_PASSWORD precisam estar definidos no .env");
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: "Administrador",
      phone: null,
      password: hashedPassword,
      role: {
        connect: { id: byRoleName[adminRole].id },
      },
      department: {
        connect: { id: byDepartmentName[adminDepartment].id },
      },
    },
    create: {
      name: "Administrador",
      phone: null,
      email: adminEmail,
      password: hashedPassword,
      role: {
        connect: { id: byRoleName[adminRole].id },
      },
      department: {
        connect: { id: byDepartmentName[adminDepartment].id },
      },
    },
  });

  console.log("Permissoes cadastradas:");
  PERMISSIONS.forEach(({ name, description }) => {
    console.log(`  - ${name}: ${description}`);
  });

  console.log("\nCargos cadastrados:");
  roleTemplates.forEach((role) => {
    console.log(`  - ${role.name} (${role.permissionNames.length} permissao(oes))`);
  });

  console.log("\nDepartamentos cadastrados:", uniqueDepartmentNames.join(", "));
  console.log(`Usuario administrador pronto: ${adminEmail}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
