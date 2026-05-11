import NextAuth from "next-auth";
import type { DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// All fine-grained permissions used across the system.
export type PermissionName =
  | "users.manage"             // Admin: create / edit / delete users
  | "print.request.create"     // Professor, Coordinator: submit a print request
  | "print.request.view_own"   // Professor, Coordinator: view their own requests
  | "print.request.view_all"   // Coordinator, Printer, Admin: view every request
  | "print.request.approve"    // Coordinator: approve a pending request
  | "print.request.reject"     // Coordinator: reject a pending request
  | "print.execute"            // Printer: mark an approved request as printed
  | "reports.view";          // Guest, Coordinator, Admin: view and export sheet-usage reports

declare module "next-auth" {
  interface User {
    role: string;
    department: string;
    permissions: PermissionName[];
  }
  interface Session {
    user: {
      id: string;
      email: string;
      role: string;
      department: string;
      permissions: PermissionName[];
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    department: string;
    permissions: PermissionName[];
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: {
          type: "email",
          label: "E-mail",
          placeholder: "exemplo@ifce.edu.br",
        },
        password: {
          type: "password",
          label: "Senha",
          placeholder: "*****",
        },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { role: true, department: true, permissions: true },
        });

        if (!user) return null;

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!passwordMatch) return null;

        return {
          id: String(user.id),
          email: user.email,
          role: user.role.name,
          department: user.department.name,
          permissions: user.permissions.map((p) => p.name as PermissionName),
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
        token.department = user.department;
        token.permissions = user.permissions;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.department = token.department;
      session.user.permissions = token.permissions;
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
});

