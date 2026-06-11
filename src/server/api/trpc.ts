import { auth } from "@/auth";
import { canAccessSolicitacoes, hasPermission, MANAGE_USERS_PERMISSION } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { initTRPC, TRPCError } from "@trpc/server";

export async function createTRPCContext() {
  const session = await auth();

  return {
    prisma,
    session,
  };
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<TRPCContext>().create();

const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user?.id) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return next({ ctx });
});

const canManageUsers = t.middleware(({ ctx, next }) => {
  if (!hasPermission(ctx.session?.user?.permissions, MANAGE_USERS_PERMISSION)) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }

  return next({ ctx });
});

const canAccessSolicitacao = t.middleware(({ ctx, next }) => {
  if (!canAccessSolicitacoes(ctx.session?.user?.role)) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }

  return next({ ctx });
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthed);
export const usersManageProcedure = protectedProcedure.use(canManageUsers);
export const solicitacaoProcedure = protectedProcedure.use(canAccessSolicitacao);
