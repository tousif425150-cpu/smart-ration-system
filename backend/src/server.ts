import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import { config } from './config';
import { AppError } from './utils/AppError';
import { errorHandler } from './middleware/errorHandler';
import healthRoutes from './routes/healthRoutes';
import riceRoutes from './routes/riceRoutes';
import notificationRoutes from './routes/notificationRoutes';
import reportRoutes from './routes/reportRoutes';
import authRoutes from './routes/authRoutes';
import familyRoutes from './routes/familyRoutes';
import settingRoutes from './routes/settingRoutes';
import downloadRoutes from './routes/downloadRoutes';

const app = express();

app.set('trust proxy', 1); // Required for Render/Cloudflare to get real client IP
app.use(helmet());

app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        config.cors.adminPanelOrigin,
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'https://smart-ration-admin.onrender.com',
      ];
      if (!origin || allowedOrigins.includes(origin) || config.nodeEnv === 'development') {
        callback(null, true);
      } else {
        callback(new AppError(`CORS blocked: ${origin}`, 403));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

const uploadDir = path.join(process.cwd(), config.upload.dir);
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`✅ Created upload directory: ${uploadDir}`);
  }
} catch (error) {
  console.error(`❌ Failed to create upload directory: ${uploadDir}`, error);
}

app.use('/uploads', express.static(uploadDir));

app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin', familyRoutes);
app.use('/api/v1', settingRoutes);
app.use('/api/v1', riceRoutes);
app.use('/api/v1', notificationRoutes);
app.use('/api/v1', reportRoutes);
app.use('/api/v1/download', downloadRoutes);

app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    name: 'Smart Ration System API',
    version: '1.0.0',
    docs: {
      health: '/api/v1/health',
      ping: '/api/v1/health/ping',
    },
  });
});

app.all('*', (req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(`Cannot find ${req.method} ${req.originalUrl} on this server.`, 404));
});

app.use(errorHandler);

const server = app.listen(config.port, '0.0.0.0', () => {
  console.log(`\n========================================`);
  console.log(`🚀 Smart Ration System API - LIVE`);
  console.log(`========================================`);
  console.log(`📍 Environment : ${config.nodeEnv}`);
  console.log(`📍 Database    : ${config.databaseUrl ? 'CONNECTED (URL Present)' : 'MISSING DATABASE_URL'}`);
  console.log(`📍 CORS Origin : ${config.cors.adminPanelOrigin}`);
  console.log(`📍 Server      : http://0.0.0.0:${config.port}`);
  console.log(`📍 Health      : /api/v1/health`);
  console.log(`========================================\n`);
});

process.on('unhandledRejection', (err: any) => {
  console.error('UNHANDLED REJECTION! 💥', err);
  server.close(() => {
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully.');
  server.close(() => {
    console.log('Process terminated!');
  });
});

export default app;
