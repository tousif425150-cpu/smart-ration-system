import { PrismaClient } from '@prisma/client';

async function verify() {
  const localUrl = process.env.LOCAL_DATABASE_URL;
  const cloudUrl = process.env.CLOUD_DATABASE_URL;

  console.log('--- Database Connection Verification ---');

  // Verify Local
  const localPrisma = new PrismaClient({ datasources: { db: { url: localUrl } } });
  try {
    await localPrisma.$connect();
    console.log('✅ Local MySQL: REACHABLE');
  } catch (err) {
    console.error('❌ Local MySQL: FAILED', (err as Error).message);
  } finally {
    await localPrisma.$disconnect();
  }

  // Verify Cloud
  const cloudPrisma = new PrismaClient({ datasources: { db: { url: cloudUrl } } });
  try {
    await cloudPrisma.$connect();
    console.log('✅ Aiven Cloud MySQL: REACHABLE (SSL REQUIRED)');
  } catch (err) {
    console.error('❌ Aiven Cloud MySQL: FAILED', (err as Error).message);
  } finally {
    await cloudPrisma.$disconnect();
  }
}

verify();
