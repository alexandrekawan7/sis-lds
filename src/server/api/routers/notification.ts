import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const notificationRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const userId = Number(ctx.session.user.id);
    return ctx.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }),

  markAsRead: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const userId = Number(ctx.session.user.id);
      
      const notification = await ctx.prisma.notification.findUnique({
        where: { id: input.id },
      });

      if (!notification || notification.userId !== userId) {
        throw new Error("Notification not found");
      }

      return ctx.prisma.notification.update({
        where: { id: input.id },
        data: { read: true },
      });
    }),

  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = Number(ctx.session.user.id);
    
    return ctx.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }),
});
