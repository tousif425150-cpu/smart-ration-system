import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import os from 'os';

export const getHealth = async (_req: Request, res: Response) => {
  let dbStatus = 'disconnected';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (e) {
    dbStatus = 'disconnected';
  }

  res.status(200).json({
    status: 'success',
    message: 'Smart Ration System API is running',
    data: {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbStatus,
      environment: process.env.NODE_ENV,
      hostname: os.hostname(),
      memory: {
        totalMB: Math.round(os.totalmem() / (1024 * 1024)),
        freeMB: Math.round(os.freemem() / (1024 * 1024)),
        usedMB: Math.round((os.totalmem() - os.freemem()) / (1024 * 1024)),
      },
    },
  });
};

export const getPing = (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'pong',
    timestamp: new Date().toISOString(),
  });
};
