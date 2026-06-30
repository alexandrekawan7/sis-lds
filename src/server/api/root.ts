import { roleRouter } from "@/server/api/routers/role";
import { solicitacaoRouter } from "@/server/api/routers/solicitacao";
import { userRouter } from "@/server/api/routers/user";
import { documentRouter } from "@/server/api/routers/document";
import { notificationRouter } from "@/server/api/routers/notification";
import { relatorioRouter } from "@/server/api/routers/relatorio";
import { dashboardRouter } from "@/server/api/routers/dashboard";
import { createTRPCRouter } from "@/server/api/trpc";

export const appRouter = createTRPCRouter({
  role: roleRouter,
  solicitacao: solicitacaoRouter,
  user: userRouter,
  document: documentRouter,
  notification: notificationRouter,
  relatorio: relatorioRouter,
  dashboard: dashboardRouter,
});

export type AppRouter = typeof appRouter;
