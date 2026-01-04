import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

// 数据库连接
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://cjudge:cjudge_dev_password@localhost:5432/cjudge";

// 防止开发环境热重载时创建多个 Prisma 实例
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: pg.Pool | undefined;
  prismaVersion: string | undefined;
};

// 版本标记，用于强制刷新
const PRISMA_VERSION = "v2_analytics";

function createPrismaClient(): PrismaClient {
  // 创建 pg Pool
  const pool = new pg.Pool({
    connectionString: DATABASE_URL,
    max: 10,
  });

  // 创建适配器
  const adapter = new PrismaPg(pool);

  // 创建 Prisma Client
  const client = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.pool = pool;
    globalForPrisma.prismaVersion = PRISMA_VERSION;
  }

  return client;
}

// 检查版本是否匹配，不匹配则重新创建
const needsRefresh = globalForPrisma.prismaVersion !== PRISMA_VERSION;

export const prisma = (!needsRefresh && globalForPrisma.prisma) ? globalForPrisma.prisma : createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
