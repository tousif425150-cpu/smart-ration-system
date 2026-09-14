import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import os from 'os';
import { getScrubbedDbInfo } from '../utils/db-diagnostic';

export const getHealth = async (_req: Request, res: Response) => {
  let dbStatus = 'disconnected';
  let dbError = null;
  try {
    // Attempt a quick query
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (e: any) {
    dbStatus = 'disconnected';
    dbError = e.message;
  }

  // Run async diagnostics
  const dbDiagnostic = await getScrubbedDbInfo();

  res.status(200).json({
    status: 'success',
    message: 'Smart Ration System API is running',
    version: '1.0.5',
    data: {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: dbStatus,
        error: dbError,
        diagnostic: dbDiagnostic
      },
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
