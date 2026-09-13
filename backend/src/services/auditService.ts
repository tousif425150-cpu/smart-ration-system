import { prisma } from '../config/prisma';

export interface CreateAuditLogInput {
  adminId?: number;
  action: string;
  targetType: string;
  targetId?: number;
  details?: Record<string, any>;
  ipAddress?: string;
}

export const createAuditLog = async (input: CreateAuditLogInput) => {
  try {
    return await prisma.auditLog.create({
      data: {
        adminId: input.adminId,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId,
        details: input.details ? JSON.stringify(input.details) : null,
        ipAddress: input.ipAddress,
      },
    });
  } catch (e) {
    console.error('Failed to create audit log:', e);
    return null;
  }
};
