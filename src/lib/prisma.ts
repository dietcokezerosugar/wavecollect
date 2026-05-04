import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["query"],
    errorFormat: 'minimal',
  });

// Simple connectivity check (non-blocking)
prisma.$connect().catch(err => {
  console.error("CRITICAL: Prisma could not connect to database on startup.", err.message);
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
