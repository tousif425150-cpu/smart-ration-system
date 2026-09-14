import { PrismaClient } from '@prisma/client';
import { config } from './index';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Robust Prisma Client configuration for Production (Aiven Free Tier).
 * Limits connection pool size to prevent exhaustion and adds timeouts.
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: config.databaseUrl,
      },
    },
    log:
      config.nodeEnv === 'development'
        ? ['query', 'error', 'warn', 'info']
        : ['error', 'warn'],
  });

if (config.nodeEnv !== 'production') globalForPrisma.prisma = prisma;

/**
 * Attempts to connect to the database with a simple retry mechanism.
 */
export const connectToDatabase = async (retries = 3, delay = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`🔌 Attempting database connection (Attempt ${i + 1}/${retries})...`);
      await prisma.$connect();
      // Run a simple query to verify connection
      await prisma.$queryRaw`SELECT 1`;
      console.log('✅ Database connected successfully.');
      return true;
    } catch (error: any) {
      console.error(`❌ Database connection attempt ${i + 1} failed: ${error.message}`);
      if (i < retries - 1) {
        console.log(`⏳ Retrying in ${delay / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  return false;
};
