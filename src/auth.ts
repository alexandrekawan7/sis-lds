import NextAuth from "next-auth";
import type { DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { PermissionName } from "@/lib/permissions";
import { validateLoginCredentials } from "@/services/login";

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
      authorize: validateLoginCredentials,
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,  
    updateAge: 60 * 60,    
  },
  callbacks: {
    async jwt({ token, user }) {
      const mutableToken = token as typeof token & Partial<TokenUserData>;

      if (user) {
        mutableToken.id = user.id as string;
        mutableToken.role = user.role;
        mutableToken.department = user.department;
        mutableToken.permissions = user.permissions;
        mutableToken.iat = Math.floor(Date.now() / 1000);
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

