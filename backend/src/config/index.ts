import dotenv from 'dotenv';
import path from 'path';

// Load .env if present (works in local dev and won't hurt in production)
dotenv.config({ path: path.join(process.cwd(), '.env') });

const nodeEnv = process.env.NODE_ENV || 'development';

if (nodeEnv === 'production' && !process.env.DATABASE_URL) {
  console.warn('⚠️ WARNING: DATABASE_URL is missing in production environment!');
}

let databaseUrl = process.env.DATABASE_URL || '';

// If in production and using Aiven, ensure pooling parameters are optimized for free tier
if (nodeEnv === 'production' && databaseUrl.includes('aivencloud.com')) {
  if (!databaseUrl.includes('connection_limit')) {
    const separator = databaseUrl.includes('?') ? '&' : '?';
    databaseUrl += `${separator}connection_limit=3&pool_timeout=20&connect_timeout=20`;
  }
}

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv,
  databaseUrl,
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-change-me',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '30m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  cors: {
    adminPanelOrigin: process.env.ADMIN_PANEL_ORIGIN || 'http://localhost:5173',
  },
  faceModelsDir: process.env.FACE_MODELS_DIR || 'models/face',
  upload: {
    dir: process.env.UPLOAD_DIR || 'uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10),
  },
};
