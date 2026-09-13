import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAll() {
  console.log('--- Admins ---');
  const admins = await prisma.admin.findMany();
  console.log(admins);

  console.log('--- Users ---');
  const users = await prisma.user.findMany();
  console.log(users);

  process.exit(0);
}

checkAll();
