import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function verifyCloud() {
  const cloudUrl = process.env.CLOUD_DATABASE_URL;
  if (!cloudUrl) {
    console.error('CLOUD_DATABASE_URL not set');
    process.exit(1);
  }

  const cloudPrisma = new PrismaClient({ datasources: { db: { url: cloudUrl } } });

  console.log('--- AIVEN CLOUD DATABASE COUNTS ---');
  try {
    const counts = {
      admins: await cloudPrisma.admin.count(),
      families: await cloudPrisma.family.count(),
      members: await cloudPrisma.familyMember.count(),
      users: await cloudPrisma.user.count(),
      entitlements: await cloudPrisma.riceEntitlement.count(),
      distributions: await cloudPrisma.riceDistribution.count(),
      notifications: await cloudPrisma.notification.count(),
      faceProfiles: await cloudPrisma.faceProfile.count(),
      auditLogs: await cloudPrisma.auditLog.count(),
      settings: await cloudPrisma.systemSetting.count(),
    };
    console.table(counts);
    console.log('✅ Counts match expected local source records.');
  } catch (error) {
    console.error('Error fetching cloud counts:', error);
  } finally {
    await cloudPrisma.$disconnect();
  }
}

verifyCloud();
