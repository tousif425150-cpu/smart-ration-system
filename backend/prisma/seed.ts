import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEFAULT_ADMIN = {
  username: 'admin',
  password: 'admin123',
  fullName: 'System Administrator',
  email: 'admin@smartration.gov',
};

async function main() {
  console.log('🌱 Seeding database...');

  const existingAdmin = await prisma.admin.findUnique({
    where: { username: DEFAULT_ADMIN.username },
  });

  if (existingAdmin) {
    console.log(`⚠️  Admin "${DEFAULT_ADMIN.username}" already exists. Skipping.`);
  } else {
    const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN.password, 12);
    const admin = await prisma.admin.create({
      data: {
        username: DEFAULT_ADMIN.username,
        passwordHash: hashedPassword,
        fullName: DEFAULT_ADMIN.fullName,
        email: DEFAULT_ADMIN.email,
        updatedAt: new Date(),
      },
      select: { id: true, username: true, fullName: true, email: true, createdAt: true },
    });

    console.log('\n========================================');
    console.log('✅ DEFAULT ADMIN CREATED SUCCESSFULLY');
    console.log('========================================');
    console.log(`👤 Username   : ${admin.username}`);
    console.log(`🔐 Password   : ${DEFAULT_ADMIN.password}`);
    console.log(`📛 Full Name  : ${admin.fullName}`);
    console.log(`📧 Email      : ${admin.email}`);
    console.log(`❗ IMPORTANT  : Change this password on first login!`);
    console.log('========================================\n');

    await prisma.auditLog.create({
      data: {
        adminId: admin.id,
        action: 'SEED_ADMIN_CREATED',
        targetType: 'ADMIN',
        targetId: admin.id,
        details: JSON.stringify({ note: 'Initial admin user created via seed script' }),
        ipAddress: 'SYSTEM',
      },
    });
    console.log('📝 Audit log entry created for admin seed.');
  }

  console.log('✅ Database seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
