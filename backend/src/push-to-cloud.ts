import { execSync } from 'child_process';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function push() {
  const cloudUrl = process.env.CLOUD_DATABASE_URL;
  if (!cloudUrl) {
    console.error('CLOUD_DATABASE_URL not set');
    process.exit(1);
  }

  console.log('Pushing schema to Aiven Cloud MySQL...');
  try {
    execSync('npx prisma db push --skip-generate', {
      env: { ...process.env, DATABASE_URL: cloudUrl },
      stdio: 'inherit'
    });
    console.log('✅ Schema pushed successfully.');
  } catch (error) {
    console.error('❌ Schema push failed.');
    process.exit(1);
  }
}

push();
