import NextAuth from "next-auth";
import type { DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { PermissionName } from "@/lib/permissions";

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

type TokenUserData = {
  id: string;
  role: string;
  department: string;
  permissions: PermissionName[];
};

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
          include: {
            role: {
              include: { permissions: true },
            },
            department: true,
          },
        });

        if (!user) return null;

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!passwordMatch) return null;

        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
          role: user.role.name,
          department: user.department.name,
          permissions: user.role.permissions.map((p) => p.name as PermissionName),
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      const mutableToken = token as typeof token & Partial<TokenUserData>;

      if (user) {
        mutableToken.id = user.id as string;
        mutableToken.role = user.role;
        mutableToken.department = user.department;
        mutableToken.permissions = user.permissions;
      }

      return mutableToken;
    },
    async session({ session, token }) {
      const typedToken = token as typeof token & Partial<TokenUserData>;

      session.user.id = typedToken.id ?? "";
      session.user.role = typedToken.role ?? "";
      session.user.department = typedToken.department ?? "";
      session.user.permissions = typedToken.permissions ?? [];

      return session;
    },
  },
  pages: {
    signIn: "/",
  },
});

