import { PrismaClient } from '@prisma/client';

async function listTables() {
  const cloudUrl = process.env.CLOUD_DATABASE_URL;
  if (!cloudUrl) {
    console.error('CLOUD_DATABASE_URL not set');
    return;
  }

  const prisma = new PrismaClient({ datasources: { db: { url: cloudUrl } } });

  try {
    console.log('--- Listing Tables in Cloud DB ---');
    const tables: any = await prisma.$queryRawUnsafe('SHOW TABLES');
    console.log(JSON.stringify(tables, null, 2));
  } catch (error) {
    console.error('Error listing tables:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listTables();
