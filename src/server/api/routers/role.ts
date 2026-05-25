import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, usersManageProcedure } from "@/server/api/trpc";

const createRoleInput = z.object({
  name: z.string().trim().min(3, "Informe o nome do cargo"),
  permissionIds: z.array(z.number().int().positive()),
});

const updateRoleInput = z.object({
  id: z.number().int().positive(),
  name: z.string().trim().min(3, "Informe o nome do cargo"),
  permissionIds: z.array(z.number().int().positive()),
});

export const roleRouter = createTRPCRouter({
  list: usersManageProcedure.query(async ({ ctx }) => {
    return ctx.prisma.role.findMany({
      include: {
        permissions: {
          orderBy: { name: "asc" },
        },
        _count: {
          select: { users: true },
        },
      },
      orderBy: { name: "asc" },
    });
  }),

  permissionOptions: usersManageProcedure.query(async ({ ctx }) => {
    return ctx.prisma.permission.findMany({
      orderBy: { name: "asc" },
    });
  }),

  create: usersManageProcedure
    .input(createRoleInput)
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.role.create({
        data: {
          name: input.name,
          permissions: {
            connect: input.permissionIds.map((id) => ({ id })),
          },
        },
      });
    }),

  update: usersManageProcedure
    .input(updateRoleInput)
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.role.update({
        where: { id: input.id },
        data: {
          name: input.name,
          permissions: {
            set: input.permissionIds.map((id) => ({ id })),
          },
        },
      });
    }),

  delete: usersManageProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const role = await ctx.prisma.role.findUnique({
        where: { id: input.id },
        include: {
          _count: {
            select: { users: true },
          },
        },
      });

      if (!role) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Cargo não encontrado." });
      }

      if (role._count.users > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Não é possível excluir um cargo que possui usuários vinculados.",
        });
      }

      await ctx.prisma.role.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});
