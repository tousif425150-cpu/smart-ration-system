import { PrismaClient } from '@prisma/client';

async function checkCounts() {
  const localPrisma = new PrismaClient();
  // For cloud, we will need to temporarily set DATABASE_URL

  console.log('--- LOCAL DATABASE COUNTS ---');
  try {
    const counts = {
      admins: await localPrisma.admin.count(),
      families: await localPrisma.family.count(),
      members: await localPrisma.familyMember.count(),
      users: await localPrisma.user.count(),
      entitlements: await localPrisma.riceEntitlement.count(),
      distributions: await localPrisma.riceDistribution.count(),
      notifications: await localPrisma.notification.count(),
      faceProfiles: await localPrisma.faceProfile.count(),
      auditLogs: await localPrisma.auditLog.count(),
      settings: await localPrisma.systemSetting.count(),
    };
    console.table(counts);
  } catch (error) {
    console.error('Error fetching local counts:', error);
  } finally {
    await localPrisma.$disconnect();
  }
}

checkCounts();
