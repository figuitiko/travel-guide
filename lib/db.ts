import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
function makeClient() {
  const url = process.env.DATABASE_URL;
  if (!url) return new PrismaClient();
  const adapter = new PrismaPg(url);
  return new PrismaClient({ adapter });
}
export const prisma = globalForPrisma.prisma ?? makeClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
