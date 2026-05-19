import { roleRouter } from "@/server/api/routers/role";
import { userRouter } from "@/server/api/routers/user";
import { createTRPCRouter } from "@/server/api/trpc";

export const appRouter = createTRPCRouter({
  role: roleRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
