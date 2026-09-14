import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { comparePassword, hashPassword } from '../utils/password';
import { signAccessToken, signRefreshToken } from '../utils/jwt';
import { createAuditLog } from '../services/auditService';
import * as faceService from '../services/faceService';
import path from 'path';
import fs from 'fs';
import {
  adminLoginSchema,
  userLoginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  faceVerifySchema,
} from '../utils/validators';
import { AuthRequest } from '../middleware/auth';

const getClientIp = (req: Request): string | undefined => {
  const xff = req.headers['x-forwarded-for'];
  if (Array.isArray(xff)) return xff[0];
  if (typeof xff === 'string') return xff.split(',')[0].trim();
  return req.socket?.remoteAddress || req.ip;
};

export const adminLogin = asyncHandler(async (req, res: Response) => {
  const { username, password } = adminLoginSchema.parse(req.body);

  const admin = await prisma.admin.findUnique({ where: { username } });
  if (!admin) {
    throw new AppError('Invalid username or password', 401);
  }

  const isPasswordValid = await comparePassword(password, admin.passwordHash);
  if (!isPasswordValid) {
    throw new AppError('Invalid username or password', 401);
  }

  const accessToken = signAccessToken({
    id: admin.id,
    role: 'ADMIN',
    username: admin.username,
  });

  const refreshToken = signRefreshToken({
    id: admin.id,
    role: 'ADMIN',
    username: admin.username,
  });

  await createAuditLog({
    adminId: admin.id,
    action: 'ADMIN_LOGIN',
    targetType: 'ADMIN',
    targetId: admin.id,
    details: { username: admin.username },
    ipAddress: getClientIp(req),
  });

  res.status(200).json({
    status: 'success',
    message: 'Admin logged in successfully',
    data: {
      accessToken,
      refreshToken,
      admin: {
        id: admin.id,
        username: admin.username,
        fullName: admin.fullName,
        email: admin.email,
      },
    },
  });
});

export const userLogin = asyncHandler(async (req, res: Response) => {
  const { username, password } = userLoginSchema.parse(req.body);

  const user = (await prisma.user.findUnique({
    where: { username },
    include: {
      familyMember: true,
    },
  })) as any;

  if (!user) {
    throw new AppError('Invalid username or password', 401);
  }

  const isPasswordValid = await comparePassword(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new AppError('Invalid username or password', 401);
  }

  if (user.familyMember && user.familyMember.accountStatus && user.familyMember.accountStatus !== 'ACTIVE') {
    throw new AppError('Account is inactive. Please contact administrator.', 403);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const accessToken = signAccessToken({
    id: user.id,
    role: 'USER',
    username: user.username,
  });

  const refreshToken = signRefreshToken({
    id: user.id,
    role: 'USER',
    username: user.username,
  });

  await createAuditLog({
    action: 'USER_LOGIN',
    targetType: 'USER',
    targetId: user.id,
    details: { username: user.username, familyId: user.familyMember?.familyId },
    ipAddress: getClientIp(req),
  });

  res.status(200).json({
    status: 'success',
    message: 'User logged in successfully',
    data: {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        familyMemberId: user.familyMemberId,
        familyMember: user.familyMember,
        lastLoginAt: user.lastLoginAt,
      },
    },
  });
});

export const logout = asyncHandler(async (_req, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully',
  });
});

export const changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { oldPassword, newPassword } = changePasswordSchema.parse(req.body);

  if (!req.user) {
    throw new AppError('Not authorized', 401);
  }

  const { id, role, username } = req.user;

  if (role === 'ADMIN') {
    const admin = await prisma.admin.findUnique({ where: { id } });
    if (!admin) {
      throw new AppError('Admin not found', 404);
    }

    const isOldValid = await comparePassword(oldPassword, admin.passwordHash);
    if (!isOldValid) {
      throw new AppError('Old password is incorrect', 401);
    }

    const newHash = await hashPassword(newPassword);
    await prisma.admin.update({
      where: { id },
      data: { passwordHash: newHash },
    });

    await createAuditLog({
      adminId: id,
      action: 'ADMIN_CHANGE_PASSWORD',
      targetType: 'ADMIN',
      targetId: id,
      details: { username },
      ipAddress: getClientIp(req),
    });
  } else {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const isOldValid = await comparePassword(oldPassword, user.passwordHash);
    if (!isOldValid) {
      throw new AppError('Old password is incorrect', 401);
    }

    const newHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id },
      data: { passwordHash: newHash },
    });

    await createAuditLog({
      action: 'USER_CHANGE_PASSWORD',
      targetType: 'USER',
      targetId: id,
      details: { username },
      ipAddress: getClientIp(req),
    });
  }

  res.status(200).json({
    status: 'success',
    message: 'Password changed successfully',
  });
});

export const forgotPassword = asyncHandler(async (req, res: Response) => {
  forgotPasswordSchema.parse(req.body);

  res.status(200).json({
    status: 'success',
    message:
      'If the account exists, password reset instructions will be sent. (Email service not configured)',
  });
});

export const updateFcmToken = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { fcmToken } = req.body;
  if (!req.user) throw new AppError('Not authorized', 401);

  if (req.user.role === 'USER') {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { fcmToken },
    });
  }

  res.status(200).json({
    status: 'success',
    message: 'FCM token updated successfully',
  });
});

export const faceVerify = asyncHandler(async (req, res: Response) => {
  const { username, imageBase64 } = faceVerifySchema.parse(req.body);

  if (!imageBase64) {
    throw new AppError('Face image is required', 400);
  }

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      familyMember: {
        include: {
          faceProfile: true,
        },
      },
    },
  });

  if (!user || !user.familyMember?.faceProfile) {
    throw new AppError('No enrolled face found for this user', 404);
  }

  const storedEmbedding = JSON.parse(user.familyMember.faceProfile.faceEmbedding || '[]');
  if (storedEmbedding.length === 0) {
    throw new AppError('Invalid face profile', 400);
  }

  // Save temporary image for processing
  const tempDir = path.resolve(__dirname, '../../uploads/temp');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const tempPath = path.join(tempDir, `verify_${Date.now()}.jpg`);
  const buffer = Buffer.from(imageBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
  fs.writeFileSync(tempPath, buffer);

  const isMatch = await faceService.compareFaces(tempPath, storedEmbedding);

  // Clean up temp file
  try { fs.unlinkSync(tempPath); } catch (e) {}

  res.status(200).json({
    status: 'success',
    data: {
      match: isMatch,
    },
  });
});
