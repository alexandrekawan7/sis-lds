import { roleRouter } from "@/server/api/routers/role";
import { solicitacaoRouter } from "@/server/api/routers/solicitacao";
import { userRouter } from "@/server/api/routers/user";
import { createTRPCRouter } from "@/server/api/trpc";

export const appRouter = createTRPCRouter({
  role: roleRouter,
  solicitacao: solicitacaoRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
