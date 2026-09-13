import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAdmin() {
  console.log('Checking Admin records in database...');
  try {
    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        createdAt: true
      }
    });

    if (admins.length === 0) {
      console.log('No admins found in database.');
    } else {
      console.log(`Found ${admins.length} admin(s):`);
      admins.forEach(a => {
        console.log(`- ID: ${a.id}, Username: ${a.username}, Name: ${a.fullName}`);
      });
    }
    process.exit(0);
  } catch (error) {
    console.error('Error checking admin:', error);
    process.exit(1);
  }
}

checkAdmin();
