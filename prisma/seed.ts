import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
})

// Mirrors the PermissionName type in src/auth.ts.
// Each entry: [name, description, roles that receive it by default]
const PERMISSIONS: Array<{ name: string; description: string }> = [
  // ── User management ────────────────────────────────────────────────
  { name: "users.manage",           description: "Create, edit and delete users (Admin)" },

  // ── Print requests ─────────────────────────────────────────────────
  { name: "print.request.create",   description: "Submit a new print request (Professor, Coordinator)" },
  { name: "print.request.view_own", description: "View own print requests (Professor, Coordinator)" },
  { name: "print.request.view_all", description: "View all print requests (Coordinator, Printer, Admin)" },
  { name: "print.request.approve",  description: "Approve a pending print request (Coordinator)" },
  { name: "print.request.reject",   description: "Reject a pending print request (Coordinator)" },

  // ── Printing execution ─────────────────────────────────────────────
  { name: "print.execute",          description: "Mark an approved request as printed (Printer)" },

  // ── Reports ────────────────────────────────────────────────────────
  { name: "reports.view",           description: "View and export sheet-usage reports (Guest, Coordinator, Admin)" },
];

const ROLES = [
  process.env.ADMIN_ROLE,
  "Professor",
];

const DEPARTMENTS = [
  process.env.ADMIN_DEPARTMENT,
  "Matemática",
  "Física",
  "Engenharia Elétrica",
  "Engenharia Mecânica",
  "Sistemas de Informação"
];

async function main(): Promise<void> {
  // Upsert roles.
  const roles = await Promise.all(
    ROLES.map((name) =>

      prisma.role.upsert({
        where: { name },
        update: {},
        create: { name: name as string },
      })
    )
  );

  const byRole = Object.fromEntries(roles.map((r) => [r.name, r]));

  // Upsert departments.
  const departments = await Promise.all(
    DEPARTMENTS.map((name) =>
      prisma.department.upsert({
        where: { name },
        update: {},
        create: { name: name as string },
      })
    )
  );

  const byDept = Object.fromEntries(departments.map((d) => [d.name, d]));

  // Upsert every permission so re-running the seed is safe.
  const permissions = await Promise.all(
    PERMISSIONS.map(({ name }) =>
      prisma.permission.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    )
  );

  const byPerm = Object.fromEntries(permissions.map((p) => [p.name, p]));

  const adminEmail = process.env.ADMIN_EMAIL!;
  const adminPassword = process.env.ADMIN_PASSWORD!;
  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  // Admin receives: users.manage + read-all (helpful for support)
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: hashedPassword,
      role: { connect: { id: byRole[process.env.ADMIN_ROLE as string].id } },
      department: { connect: { id: byDept[process.env.ADMIN_DEPARTMENT as string].id } },
      permissions: {
        connect: [
          { id: byPerm["users.manage"].id },
          { id: byPerm["print.request.view_all"].id },
        ],
      },
    },
  });

  console.log("Roles seeded:", ROLES.join(", "));
  console.log("Departments seeded:", DEPARTMENTS.join(", "));
  console.log("Permissions seeded:");
  PERMISSIONS.forEach(({ name, description }) =>
    console.log(`  • ${name.padEnd(30)} — ${description}`)
  );
  console.log(`\nAdmin user seeded: ${adminEmail}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

