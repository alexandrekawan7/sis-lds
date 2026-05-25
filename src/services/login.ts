import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import type { PermissionName } from "@/lib/permissions";

export type LoginCredentials = {
  email?: unknown;
  password?: unknown;
};

export type AuthorizedLoginUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  permissions: PermissionName[];
};

function readCredential(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export async function validateLoginCredentials(
  credentials: LoginCredentials | null | undefined
): Promise<AuthorizedLoginUser | null> {
  const email = readCredential(credentials?.email);
  const password = readCredential(credentials?.password);

  if (!email || !password) return null;

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      role: {
        include: { permissions: true },
      },
      department: true,
    },
  });

  if (!user) return null;

  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) return null;

  return {
    id: String(user.id),
    name: user.name,
    email: user.email,
    role: user.role.name,
    department: user.department.name,
    permissions: user.role.permissions.map((p) => p.name as PermissionName),
  };
}
