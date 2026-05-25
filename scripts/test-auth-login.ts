import assert from "node:assert/strict";
import "dotenv/config";
import bcrypt from "bcryptjs";

import { prisma } from "../src/lib/prisma";
import { MANAGE_USERS_PERMISSION } from "../src/lib/permissions";
import { validateLoginCredentials } from "../src/services/login";

const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const roleName = `Teste login ${suffix}`;
const departmentName = `Departamento login ${suffix}`;
const email = `teste-login-${suffix}@example.com`;
const password = "SenhaLogin123!";

async function assertDatabaseConnection() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL precisa estar definida para testar o login.");
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    throw new Error(
      "Não foi possível conectar ao banco definido em DATABASE_URL. Inicie o Postgres antes de rodar npm run test:auth.",
      { cause: error }
    );
  }
}

async function createLoginFixture() {
  const permission = await prisma.permission.upsert({
    where: { name: MANAGE_USERS_PERMISSION },
    update: {},
    create: { name: MANAGE_USERS_PERMISSION },
  });

  const role = await prisma.role.create({
    data: {
      name: roleName,
      permissions: {
        connect: { id: permission.id },
      },
    },
  });

  const department = await prisma.department.create({
    data: { name: departmentName },
  });

  const user = await prisma.user.create({
    data: {
      name: "Usuário teste login",
      email,
      password: await bcrypt.hash(password, 12),
      roleId: role.id,
      departmentId: department.id,
    },
  });

  return { user, role, department };
}

async function cleanupLoginFixture() {
  await prisma.user.deleteMany({ where: { email } });
  await prisma.role.deleteMany({ where: { name: roleName } });
  await prisma.department.deleteMany({ where: { name: departmentName } });
}

async function expectInvalidLogin(
  description: string,
  credentials: Parameters<typeof validateLoginCredentials>[0]
) {
  const result = await validateLoginCredentials(credentials);
  assert.equal(result, null);
  console.log(`OK - ${description}`);
}

async function testValidLogin() {
  const { user } = await createLoginFixture();

  const authenticatedUser = await validateLoginCredentials({ email, password });

  assert.ok(authenticatedUser);
  assert.equal(authenticatedUser.id, String(user.id));
  assert.equal(authenticatedUser.name, "Usuário teste login");
  assert.equal(authenticatedUser.email, email);
  assert.equal(authenticatedUser.role, roleName);
  assert.equal(authenticatedUser.department, departmentName);
  assert.deepEqual(authenticatedUser.permissions, [MANAGE_USERS_PERMISSION]);
  assert.equal(
    Object.prototype.hasOwnProperty.call(authenticatedUser, "password"),
    false
  );

  console.log("OK - login válido retorna usuário autorizado sem senha");
}

async function main() {
  try {
    await assertDatabaseConnection();
    await cleanupLoginFixture();
    await testValidLogin();

    await expectInvalidLogin("senha incorreta retorna null", {
      email,
      password: "senha-errada",
    });
    await expectInvalidLogin("usuário inexistente retorna null", {
      email: `nao-existe-${suffix}@example.com`,
      password,
    });
    await expectInvalidLogin("email ausente retorna null", { password });
    await expectInvalidLogin("senha ausente retorna null", { email });
    await expectInvalidLogin("credenciais ausentes retornam null", undefined);
    await expectInvalidLogin("tipos inválidos retornam null", {
      email: 123,
      password: true,
    });

    console.log("Todos os testes de login passaram.");
  } finally {
    await cleanupLoginFixture();
  }
}

main()
  .catch((error) => {
    console.error("Erro no script de teste de login:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
