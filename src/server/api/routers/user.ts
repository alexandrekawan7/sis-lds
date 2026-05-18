import bcrypt from "bcryptjs";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  usersManageProcedure,
} from "@/server/api/trpc";

const MAX_PHOTO_SIZE_BYTES = 512 * 1024;

const photoDataUrlInput = z
  .string()
  .trim()
  .min(1, "Imagem invalida")
  .max(1_000_000, "Imagem muito grande");

const createUserInput = z.object({
  name: z.string().trim().min(3, "Informe o nome completo"),
  email: z.string().trim().email("Email invalido"),
  phone: z.string().trim().max(30).optional().nullable(),
  roleId: z.number().int().positive(),
  departmentId: z.number().int().positive(),
  password: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
  photoDataUrl: photoDataUrlInput.optional().nullable(),
});

const updateUserInput = z.object({
  id: z.number().int().positive(),
  name: z.string().trim().min(3, "Informe o nome completo"),
  email: z.string().trim().email("Email invalido"),
  phone: z.string().trim().max(30).optional().nullable(),
  roleId: z.number().int().positive(),
  departmentId: z.number().int().positive(),
  password: z.string().min(6, "Senha deve ter ao menos 6 caracteres").optional(),
  photoDataUrl: photoDataUrlInput.optional().nullable(),
});

const updateMeInput = z.object({
  name: z.string().trim().min(3, "Informe o nome"),
  phone: z.string().trim().max(30).optional().nullable(),
  photoDataUrl: photoDataUrlInput.optional().nullable(),
});

const createDepartmentInput = z.object({
  name: z.string().trim().min(2, "Informe o nome do departamento"),
});

const updateDepartmentInput = z.object({
  id: z.number().int().positive(),
  name: z.string().trim().min(2, "Informe o nome do departamento"),
});

function parsePhotoDataUrl(photoDataUrl: string) {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/u.exec(photoDataUrl);

  if (!match) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Formato de imagem invalido. Use JPG, PNG, WEBP ou GIF.",
    });
  }

  const photo = Buffer.from(match[2], "base64");

  if (!photo.length) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Imagem invalida.",
    });
  }

  if (photo.length > MAX_PHOTO_SIZE_BYTES) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "A imagem deve ter no maximo 512KB.",
    });
  }

  return {
    photo,
    photoMimeType: match[1].toLowerCase(),
  };
}

function buildPhotoDataUrl(photo: Uint8Array | null, photoMimeType: string | null) {
  if (!photo) return null;

  const mimeType = photoMimeType?.trim() || "image/png";

  return `data:${mimeType};base64,${Buffer.from(photo).toString("base64")}`;
}

function resolvePhotoUpdate(photoDataUrl: string | null | undefined) {
  if (photoDataUrl === undefined) {
    return {};
  }

  if (photoDataUrl === null) {
    return {
      photo: null,
      photoMimeType: null,
    };
  }

  return parsePhotoDataUrl(photoDataUrl);
}

export const userRouter = createTRPCRouter({
  departmentList: usersManageProcedure.query(async ({ ctx }) => {
    return ctx.prisma.department.findMany({
      include: {
        _count: {
          select: { users: true },
        },
      },
      orderBy: { name: "asc" },
    });
  }),

  departmentCreate: usersManageProcedure
    .input(createDepartmentInput)
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.department.create({
        data: {
          name: input.name,
        },
      });
    }),

  departmentUpdate: usersManageProcedure
    .input(updateDepartmentInput)
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.department.update({
        where: { id: input.id },
        data: {
          name: input.name,
        },
      });
    }),

  departmentDelete: usersManageProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const department = await ctx.prisma.department.findUnique({
        where: { id: input.id },
        include: {
          _count: {
            select: { users: true },
          },
        },
      });

      if (!department) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Departamento nao encontrado.",
        });
      }

      if (department._count.users > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Nao e possivel excluir um departamento com usuarios vinculados.",
        });
      }

      await ctx.prisma.department.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  list: usersManageProcedure.query(async ({ ctx }) => {
    const users = await ctx.prisma.user.findMany({
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
        department: true,
      },
      orderBy: { id: "asc" },
    });

    return users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: {
        id: user.role.id,
        name: user.role.name,
      },
      department: user.department,
      permissions: user.role.permissions,
      photoDataUrl: buildPhotoDataUrl(user.photo, user.photoMimeType),
    }));
  }),

  formOptions: usersManageProcedure.query(async ({ ctx }) => {
    const [roles, departments] = await Promise.all([
      ctx.prisma.role.findMany({ orderBy: { name: "asc" } }),
      ctx.prisma.department.findMany({ orderBy: { name: "asc" } }),
    ]);

    return {
      roles,
      departments,
    };
  }),

  create: usersManageProcedure
    .input(createUserInput)
    .mutation(async ({ ctx, input }) => {
      const hashedPassword = await bcrypt.hash(input.password, 12);
      const photoPayload = input.photoDataUrl ? parsePhotoDataUrl(input.photoDataUrl) : undefined;

      await ctx.prisma.user.create({
        data: {
          name: input.name,
          email: input.email,
          phone: input.phone?.trim() || null,
          password: hashedPassword,
          role: { connect: { id: input.roleId } },
          department: { connect: { id: input.departmentId } },
          ...(photoPayload ?? {}),
        },
      });

      return { success: true };
    }),

  update: usersManageProcedure
    .input(updateUserInput)
    .mutation(async ({ ctx, input }) => {
      const password = input.password?.trim();
      const photoPayload = resolvePhotoUpdate(input.photoDataUrl);

      await ctx.prisma.user.update({
        where: { id: input.id },
        data: {
          name: input.name,
          email: input.email,
          phone: input.phone?.trim() || null,
          role: { connect: { id: input.roleId } },
          department: { connect: { id: input.departmentId } },
          ...photoPayload,
          ...(password
            ? {
                password: await bcrypt.hash(password, 12),
              }
            : {}),
        },
      });

      return { success: true };
    }),

  resetPassword: usersManageProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const defaultResetPassword = process.env.DEFAULT_RESET_PASSWORD?.trim();

      if (!defaultResetPassword || defaultResetPassword.length < 6) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "DEFAULT_RESET_PASSWORD nao esta configurada corretamente.",
        });
      }

      const hashedPassword = await bcrypt.hash(defaultResetPassword, 12);

      await ctx.prisma.user.update({
        where: { id: input.id },
        data: {
          password: hashedPassword,
        },
      });

      return { success: true };
    }),

  delete: usersManageProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.user.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  me: protectedProcedure.query(async ({ ctx }) => {
    const userId = Number(ctx.session?.user?.id);

    const user = await ctx.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
        department: true,
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      department: user.department,
      photoDataUrl: buildPhotoDataUrl(user.photo, user.photoMimeType),
    };
  }),

  updateMe: protectedProcedure
    .input(updateMeInput)
    .mutation(async ({ ctx, input }) => {
      const userId = Number(ctx.session?.user?.id);
      const photoPayload = resolvePhotoUpdate(input.photoDataUrl);

      await ctx.prisma.user.update({
        where: { id: userId },
        data: {
          name: input.name,
          phone: input.phone?.trim() || null,
          ...photoPayload,
        },
      });

      return { success: true };
    }),
});
