import { PrismaClient } from "@prisma/client";

// ✅ CLEAN CODE P2: Singleton — evita múltiples instancias con hot-reload (nodemon)
const globalForPrisma = globalThis;
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma;