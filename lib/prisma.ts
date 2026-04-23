import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { getRuntimeEnv } from "@/lib/runtimeEnv";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

const runtimeEnv = getRuntimeEnv();
const connectionString = runtimeEnv.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        adapter,
        log: ["warn", "error"],
    });

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}
