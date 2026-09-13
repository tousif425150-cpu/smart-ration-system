import { PrismaClient } from '@prisma/client';

/**
 * SMART RATION SYSTEM - DATABASE MIGRATION SCRIPT
 *
 * This script safely migrates data from LOCAL MySQL to CLOUD MySQL (Aiven).
 * It preserves all primary keys, foreign keys, and relationships.
 */

async function migrate() {
  const localUrl = process.env.LOCAL_DATABASE_URL;
  const cloudUrl = process.env.CLOUD_DATABASE_URL;

  if (!localUrl || !cloudUrl) {
    console.error('Error: Please set LOCAL_DATABASE_URL and CLOUD_DATABASE_URL environment variables.');
    process.exit(1);
  }

  const localPrisma = new PrismaClient({ datasources: { db: { url: localUrl } } });
  const cloudPrisma = new PrismaClient({ datasources: { db: { url: cloudUrl } } });

  console.log('🚀 Starting Database Migration...');

  try {
    // 1. Migrate Admin
    const admins = await localPrisma.admin.findMany();
    console.log(`- Migrating ${admins.length} Admins...`);
    for (const admin of admins) {
      await cloudPrisma.admin.upsert({
        where: { id: admin.id },
        update: admin,
        create: admin,
      });
    }

    // 2. Migrate Families
    const families = await localPrisma.family.findMany();
    console.log(`- Migrating ${families.length} Families...`);
    for (const family of families) {
      await cloudPrisma.family.upsert({
        where: { id: family.id },
        update: family,
        create: family,
      });
    }

    // 3. Migrate FamilyMembers
    const members = await localPrisma.familyMember.findMany();
    console.log(`- Migrating ${members.length} Family Members...`);
    for (const member of members) {
      await cloudPrisma.familyMember.upsert({
        where: { id: member.id },
        update: member,
        create: member,
      });
    }

    // 4. Migrate Users
    const users = await localPrisma.user.findMany();
    console.log(`- Migrating ${users.length} Users...`);
    for (const user of users) {
      await cloudPrisma.user.upsert({
        where: { id: user.id },
        update: user,
        create: user,
      });
    }

    // 5. Migrate RiceEntitlements
    const entitlements = await localPrisma.riceEntitlement.findMany();
    console.log(`- Migrating ${entitlements.length} Rice Entitlements...`);
    for (const entitlement of entitlements) {
      await cloudPrisma.riceEntitlement.upsert({
        where: { id: entitlement.id },
        update: entitlement,
        create: entitlement,
      });
    }

    // 6. Migrate RiceDistributions
    const distributions = await localPrisma.riceDistribution.findMany();
    console.log(`- Migrating ${distributions.length} Rice Distributions...`);
    for (const dist of distributions) {
      await cloudPrisma.riceDistribution.upsert({
        where: { id: dist.id },
        update: dist,
        create: dist,
      });
    }

    // 7. Migrate Notifications
    const notifications = await localPrisma.notification.findMany();
    console.log(`- Migrating ${notifications.length} Notifications...`);
    for (const notif of notifications) {
      await cloudPrisma.notification.upsert({
        where: { id: notif.id },
        update: notif,
        create: notif,
      });
    }

    // 8. Migrate FaceProfiles
    const profiles = await localPrisma.faceProfile.findMany();
    console.log(`- Migrating ${profiles.length} Face Profiles...`);
    for (const profile of profiles) {
      await cloudPrisma.faceProfile.upsert({
        where: { id: profile.id },
        update: profile,
        create: profile,
      });
    }

    // 9. Migrate AuditLogs
    const logs = await localPrisma.auditLog.findMany();
    console.log(`- Migrating ${logs.length} Audit Logs...`);
    // Audit logs don't have unique constraints other than ID
    for (const log of logs) {
      await cloudPrisma.auditLog.upsert({
        where: { id: log.id },
        update: log,
        create: log,
      });
    }

    // 10. Migrate SystemSettings
    const settings = await localPrisma.systemSetting.findMany();
    console.log(`- Migrating ${settings.length} System Settings...`);
    for (const setting of settings) {
      await cloudPrisma.systemSetting.upsert({
        where: { id: setting.id },
        update: setting,
        create: setting,
      });
    }

    console.log('✅ Data Migration Complete!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await localPrisma.$disconnect();
    await cloudPrisma.$disconnect();
  }
}

migrate();
