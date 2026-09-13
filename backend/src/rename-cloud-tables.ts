import { PrismaClient } from '@prisma/client';

async function renameTables() {
  const cloudUrl = process.env.CLOUD_DATABASE_URL;
  if (!cloudUrl) {
    console.error('CLOUD_DATABASE_URL not set');
    return;
  }

  const prisma = new PrismaClient({ datasources: { db: { url: cloudUrl } } });

  const renames = [
    ['Admin', 'admin'],
    ['AuditLog', 'auditlog'],
    ['FaceProfile', 'faceprofile'],
    ['Family', 'family'],
    ['FamilyMember', 'familymember'],
    ['Notification', 'notification'],
    ['RiceDistribution', 'ricedistribution'],
    ['RiceEntitlement', 'riceentitlement'],
    ['SystemSetting', 'systemsetting'],
    ['User', 'user']
  ];

  try {
    console.log('--- Renaming Tables in Cloud DB to Lowercase ---');
    for (const [oldName, newName] of renames) {
      console.log(`Renaming ${oldName} to ${newName}...`);
      await prisma.$executeRawUnsafe(`RENAME TABLE \`${oldName}\` TO \`${newName}\``);
    }
    console.log('✅ All tables renamed successfully.');
  } catch (error) {
    console.error('Error renaming tables (they might already be renamed or missing):', error);
  } finally {
    await prisma.$disconnect();
  }
}

renameTables();
