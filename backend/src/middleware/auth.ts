import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import { verifyToken, JwtPayload } from '../utils/jwt';
import { prisma } from '../config/prisma';

export interface AuthRequest extends Request {
  user?: JwtPayload & {
    adminId?: number;
    familyId?: number;
  };
}

const extractToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }
  return null;
};

export const protect = asyncHandler(
  async (req: AuthRequest, _res: Response, next: NextFunction) => {
    const token = extractToken(req);
    if (!token) {
      return next(new AppError('Not authorized. No token provided.', 401));
    }

    const decoded = verifyToken(token);

    if (decoded.role === 'ADMIN') {
      const admin = await prisma.admin.findUnique({ where: { id: decoded.id } });
      if (!admin) {
        return next(new AppError('Admin no longer exists.', 401));
      }
      req.user = { ...decoded, adminId: admin.id };
    } else {
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        include: { familyMember: { select: { familyId: true } } },
      });
      if (!user) {
        return next(new AppError('User no longer exists.', 401));
      }
      req.user = {
        ...decoded,
        familyId: user.familyMember?.familyId,
      };
    }

    next();
  }
);

export const restrictTo = (...roles: Array<'ADMIN' | 'USER'>) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action.', 403)
      );
    }
    next();
  };
};
