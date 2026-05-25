import { roleRouter } from "@/server/api/routers/role";
import { userRouter } from "@/server/api/routers/user";
import { documentRouter } from "@/server/api/routers/document";
import { createTRPCRouter } from "@/server/api/trpc";

export const appRouter = createTRPCRouter({
  role: roleRouter,
  user: userRouter,
  document: documentRouter,
});

export type AppRouter = typeof appRouter;
