import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { AppError } from '../utils/AppError';

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  let error = { ...err };
  error.message = err.message || 'Something went wrong';
  error.statusCode = err.statusCode || 500;

  if (err.name === 'PrismaClientValidationError') {
    error = new AppError('Invalid data provided', 400);
  }

  if (err.name === 'PrismaClientKnownRequestError') {
    if (err.code === 'P2002') {
      const target = (err.meta?.target as string[]) || ['field'];
      error = new AppError(`Duplicate value for: ${target.join(', ')}`, 409);
    } else if (err.code === 'P2025') {
      error = new AppError('Record not found', 404);
    }
  }

  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token. Please log in again.', 401);
  }

  if (err.name === 'TokenExpiredError') {
    error = new AppError('Token expired. Please log in again.', 401);
  }

  if (err.name === 'ZodError') {
    const messages = err.issues.map((i: any) => `${i.path.join('.')}: ${i.message}`);
    error = new AppError(messages.join('; '), 400);
  }

  res.status(error.statusCode).json({
    status: error.status || 'error',
    message: error.message,
    ...(config.nodeEnv === 'development' && { stack: err.stack }),
  });
};
