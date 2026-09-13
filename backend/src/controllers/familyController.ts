import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { createAuditLog } from '../services/auditService';
import { hashPassword } from '../utils/password';
import { AuthRequest } from '../middleware/auth';
import * as faceService from '../services/faceService';
import path from 'path';
import fs from 'fs';

const getIpAddress = (req: AuthRequest): string | undefined => {
  const ip = req.headers['x-forwarded-for'] as string | undefined;
  return ip ? ip.split(',')[0].trim() : req.ip;
};

const getAdminId = (req: AuthRequest): number | undefined => {
  return req.user?.adminId;
};

const buildPagination = (page: number, limit: number, total: number) => {
  const totalPages = Math.ceil(total / limit);
  return { page, limit, total, totalPages };
};

export const createFamily = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const {
      familyId,
      headName,
      mobileNumber,
      address,
      username,
      password,
      memberCount,
    } = req.body;

    if (!familyId || !headName || !mobileNumber || !address || !username || !password) {
      throw new AppError('Please provide all required fields.', 400);
    }

    const existingFamily = await prisma.family.findUnique({
      where: { familyId },
    });
    if (existingFamily) {
      throw new AppError('Family with this ID already exists.', 409);
    }

    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      throw new AppError('Username already taken.', 409);
    }

    const passwordHash = await hashPassword(password);
    const adminId = getAdminId(req);
    const ipAddress = getIpAddress(req);

    const result = await prisma.$transaction(async (tx) => {
      const family = await tx.family.create({
        data: {
          familyId,
          headName,
          mobileNumber,
          address,
          members: {
            create: {
              memberId: `MEM${Date.now()}`,
              name: headName,
              relation: 'Head',
              isFamilyHead: true,
              accountStatus: 'ACTIVE',
            },
          },
        },
        include: {
          members: true,
        },
      });

      const headMember = family.members.find((m) => m.isFamilyHead)!;

      const user = await tx.user.create({
        data: {
          username,
          passwordHash,
          role: 'USER',
          familyMemberId: headMember.id,
        },
      });

      if (memberCount && memberCount > 1) {
        const defaultEntitlement = await tx.riceEntitlement.create({
          data: {
            familyId: family.id,
            monthlyQuotaKg: memberCount * 5,
            unitPerMemberKg: 5,
            effectiveFrom: new Date(),
          },
        });
        (family as any).riceEntitlement = defaultEntitlement;
      }

      void createAuditLog({
        adminId,
        action: 'CREATE_FAMILY',
        targetType: 'FAMILY',
        targetId: family.id,
        details: { familyId, headName, mobileNumber, userId: user.id },
        ipAddress,
      });

      return family;
    });

    res.status(201).json({
      status: 'success',
      data: {
        family: result,
      },
    });
  }
);

export const getAllFamilies = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const {
      search,
      familyId,
      mobile,
      isActive,
    } = req.query;

    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit as string) || 10, 1);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { headName: { contains: search as string } },
        { familyId: { contains: search as string } },
      ];
    }

    if (familyId) {
      where.familyId = familyId as string;
    }

    if (mobile) {
      where.mobileNumber = { contains: mobile as string };
    }

    if (isActive !== undefined && isActive !== null && isActive !== '') {
      where.isActive = String(isActive) === 'true';
    }

    const [total, families] = await Promise.all([
      prisma.family.count({ where }),
      prisma.family.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { members: true },
          },
          riceEntitlement: true,
        },
      }),
    ]);

    const pagination = buildPagination(page, limit, total);

    res.status(200).json({
      status: 'success',
      data: {
        items: families,
        ...pagination,
      },
    });
  }
);

export const getFamilyById = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id);

    const family = await prisma.family.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                username: true,
              },
            },
          },
        },
        riceEntitlement: true,
        _count: {
          select: { members: true },
        },
      },
    });

    if (!family) {
      throw new AppError('Family not found.', 404);
    }

    // Extract the head's username to the top level for easier frontend access
    const headMember = family.members.find((m) => m.isFamilyHead);
    const result = {
      ...family,
      username: headMember?.user?.username || null,
    };

    res.status(200).json({
      status: 'success',
      data: {
        family: result,
      },
    });
  }
);

export const updateFamily = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id);
    const { headName, mobileNumber, address, isActive } = req.body;

    const existingFamily = await prisma.family.findUnique({ where: { id } });
    if (!existingFamily) {
      throw new AppError('Family not found.', 404);
    }

    const updatedFamily = await prisma.family.update({
      where: { id },
      data: {
        headName: headName ?? existingFamily.headName,
        mobileNumber: mobileNumber ?? existingFamily.mobileNumber,
        address: address ?? existingFamily.address,
        isActive: isActive ?? existingFamily.isActive,
      },
      include: {
        members: true,
      },
    });

    void createAuditLog({
      adminId: getAdminId(req),
      action: 'UPDATE_FAMILY',
      targetType: 'FAMILY',
      targetId: id,
      details: req.body,
      ipAddress: getIpAddress(req),
    });

    res.status(200).json({
      status: 'success',
      data: {
        family: updatedFamily,
      },
    });
  }
);

export const toggleFamilyStatus = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id);
    const { isActive } = req.body;

    if (isActive === undefined || isActive === null) {
      throw new AppError('isActive field is required.', 400);
    }

    const existingFamily = await prisma.family.findUnique({ where: { id } });
    if (!existingFamily) {
      throw new AppError('Family not found.', 404);
    }

    const updatedFamily = await prisma.family.update({
      where: { id },
      data: { isActive: Boolean(isActive) },
    });

    void createAuditLog({
      adminId: getAdminId(req),
      action: isActive ? 'ACTIVATE_FAMILY' : 'DEACTIVATE_FAMILY',
      targetType: 'FAMILY',
      targetId: id,
      details: { isActive: Boolean(isActive) },
      ipAddress: getIpAddress(req),
    });

    res.status(200).json({
      status: 'success',
      data: {
        family: updatedFamily,
      },
    });
  }
);

export const createMember = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const familyId = parseInt(req.params.id);
    const {
      name,
      age,
      gender,
      relation,
      isFamilyHead,
      profilePhotoPath,
      accountStatus,
    } = req.body;

    if (!name || !relation) {
      throw new AppError('Name and relation are required.', 400);
    }

    const family = await prisma.family.findUnique({
      where: { id: familyId },
      include: { members: true },
    });

    if (!family) {
      throw new AppError('Family not found.', 404);
    }

    if (isFamilyHead && family.members.some((m) => m.isFamilyHead)) {
      throw new AppError('This family already has a head.', 409);
    }

    const lastMember = await prisma.familyMember.findFirst({
      orderBy: { id: 'desc' },
    });
    const nextSeq = (lastMember?.id || 0) + 1;
    const memberId = `MEM${String(nextSeq).padStart(5, '0')}`;

    const newMember = await prisma.familyMember.create({
      data: {
        familyId,
        memberId,
        name,
        age,
        gender,
        relation,
        isFamilyHead: Boolean(isFamilyHead),
        profilePhotoPath,
        accountStatus: accountStatus || 'ACTIVE',
      },
    });

    const memberCount = await prisma.familyMember.count({ where: { familyId } });
    const entitlement = await prisma.riceEntitlement.findUnique({
      where: { familyId },
    });

    if (entitlement) {
      const unitPerMember = entitlement.unitPerMemberKg;
      await prisma.riceEntitlement.update({
        where: { familyId },
        data: { monthlyQuotaKg: memberCount * Number(unitPerMember) },
      });
    }

    void createAuditLog({
      adminId: getAdminId(req),
      action: 'CREATE_MEMBER',
      targetType: 'FAMILY_MEMBER',
      targetId: newMember.id,
      details: { familyId, name, relation, memberId: newMember.memberId },
      ipAddress: getIpAddress(req),
    });

    res.status(201).json({
      status: 'success',
      data: {
        member: newMember,
      },
    });
  }
);

export const getFamilyMembers = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const familyId = parseInt(req.params.id);

    const family = await prisma.family.findUnique({ where: { id: familyId } });
    if (!family) {
      throw new AppError('Family not found.', 404);
    }

    const members = await prisma.familyMember.findMany({
      where: { familyId },
      orderBy: { isFamilyHead: 'desc' },
      include: {
        user: {
          select: { id: true, username: true, role: true },
        },
      },
    });

    res.status(200).json({
      status: 'success',
      data: {
        members,
      },
    });
  }
);

export const updateMember = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id);
    const {
      name,
      age,
      gender,
      relation,
      isFamilyHead,
      profilePhotoPath,
      accountStatus,
      familyId,
    } = req.body;

    const existingMember = await prisma.familyMember.findUnique({
      where: { id },
    });

    if (!existingMember) {
      throw new AppError('Family member not found.', 404);
    }

    if (isFamilyHead && !existingMember.isFamilyHead) {
      const currentHead = await prisma.familyMember.findFirst({
        where: { familyId: existingMember.familyId, isFamilyHead: true },
      });
      if (currentHead && currentHead.id !== id) {
        throw new AppError('This family already has a head.', 409);
      }
    }

    const updatedMember = await prisma.familyMember.update({
      where: { id },
      data: {
        name: name ?? existingMember.name,
        age: age ?? existingMember.age,
        gender: gender ?? existingMember.gender,
        relation: relation ?? existingMember.relation,
        isFamilyHead: isFamilyHead !== undefined ? Boolean(isFamilyHead) : existingMember.isFamilyHead,
        profilePhotoPath: profilePhotoPath ?? existingMember.profilePhotoPath,
        accountStatus: accountStatus ?? existingMember.accountStatus,
        familyId: familyId ?? existingMember.familyId,
      },
    });

    void createAuditLog({
      adminId: getAdminId(req),
      action: 'UPDATE_MEMBER',
      targetType: 'FAMILY_MEMBER',
      targetId: id,
      details: req.body,
      ipAddress: getIpAddress(req),
    });

    res.status(200).json({
      status: 'success',
      data: {
        member: updatedMember,
      },
    });
  }
);

export const deleteMember = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id);

    const existingMember = await prisma.familyMember.findUnique({
      where: { id },
      include: { family: true },
    });

    if (!existingMember) {
      throw new AppError('Family member not found.', 404);
    }

    if (existingMember.isFamilyHead) {
      throw new AppError('Cannot delete the family head directly.', 400);
    }

    const familyId = existingMember.familyId;
    const memberInfo = {
      name: existingMember.name,
      memberId: existingMember.memberId,
      familyId: existingMember.family.familyId,
    };

    await prisma.$transaction(async (tx) => {
      await tx.user.deleteMany({
        where: { familyMemberId: id },
      });

      await tx.faceProfile.deleteMany({
        where: { familyMemberId: id },
      });

      await tx.familyMember.delete({
        where: { id },
      });

      const memberCount = await tx.familyMember.count({ where: { familyId } });
      const entitlement = await tx.riceEntitlement.findUnique({
        where: { familyId },
      });

      if (entitlement) {
        const unitPerMember = entitlement.unitPerMemberKg;
        await tx.riceEntitlement.update({
          where: { familyId },
          data: { monthlyQuotaKg: memberCount * Number(unitPerMember) },
        });
      }
    });

    void createAuditLog({
      adminId: getAdminId(req),
      action: 'DELETE_MEMBER',
      targetType: 'FAMILY_MEMBER',
      targetId: id,
      details: memberInfo,
      ipAddress: getIpAddress(req),
    });

    res.status(204).json({
      status: 'success',
      data: null,
    });
  }
);

export const createUserCredentialsForMember = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id);
    const { username, password } = req.body;

    if (!username || !password) {
      throw new AppError('Username and password are required.', 400);
    }

    const member = await prisma.familyMember.findUnique({ where: { id } });
    if (!member) {
      throw new AppError('Family member not found.', 404);
    }

    const existingCredential = await prisma.user.findFirst({
      where: { familyMemberId: id },
    });
    if (existingCredential) {
      throw new AppError('This member already has user credentials.', 409);
    }

    const existingUsername = await prisma.user.findUnique({ where: { username } });
    if (existingUsername) {
      throw new AppError('Username already taken.', 409);
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        role: 'USER',
        familyMemberId: id,
      },
    });

    void createAuditLog({
      adminId: getAdminId(req),
      action: 'CREATE_MEMBER_USER',
      targetType: 'USER',
      targetId: user.id,
      details: {
        familyMemberId: id,
        memberName: member.name,
        username,
      },
      ipAddress: getIpAddress(req),
    });

    res.status(201).json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          familyMemberId: user.familyMemberId,
        },
      },
    });
  }
);

export const resetFamilyPassword = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id);
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      throw new AppError('Password must be at least 6 characters.', 400);
    }

    const family = await prisma.family.findUnique({
      where: { id },
      include: {
        members: {
          where: { isFamilyHead: true },
          include: { user: true },
        },
      },
    });

    if (!family) {
      throw new AppError('Family not found.', 404);
    }

    const headMember = family.members[0];
    if (!headMember || !headMember.user) {
      throw new AppError('No user account found for this family head.', 404);
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: headMember.user.id },
      data: { passwordHash },
    });

    void createAuditLog({
      adminId: getAdminId(req),
      action: 'RESET_FAMILY_PASSWORD',
      targetType: 'USER',
      targetId: headMember.user.id,
      details: { familyId: family.familyId, username: headMember.user.username },
      ipAddress: getIpAddress(req),
    });

    res.status(200).json({
      status: 'success',
      message: 'Password reset successfully.',
    });
  }
);

export const enrollFace = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const familyMemberId = parseInt(req.params.id);
    const { faceData } = req.body; // Base64 image string

    if (!faceData) {
      throw new AppError('Face image data is required.', 400);
    }

    const member = await prisma.familyMember.findUnique({
      where: { id: familyMemberId },
    });
    if (!member) {
      throw new AppError('Family member not found.', 404);
    }

    const uploadDir = path.resolve(__dirname, '../../uploads/faces');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const fileName = `face_${familyMemberId}_${Date.now()}.jpg`;
    const filePath = path.join(uploadDir, fileName);
    const buffer = Buffer.from(faceData.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    fs.writeFileSync(filePath, buffer);

    const embedding = await faceService.generateEmbedding(filePath);
    if (!embedding) {
      try { fs.unlinkSync(filePath); } catch(e) {}
      throw new AppError('No face detected in the image.', 400);
    }

    const faceProfile = await prisma.faceProfile.upsert({
      where: { familyMemberId },
      update: {
        faceImagePath: fileName,
        faceEmbedding: JSON.stringify(embedding),
        enrolledBy: req.user?.adminId ?? 0,
        enrolledAt: new Date(),
        isActive: true,
      },
      create: {
        familyMemberId,
        faceImagePath: fileName,
        faceEmbedding: JSON.stringify(embedding),
        enrolledBy: req.user?.adminId ?? 0,
        isActive: true,
      },
    });

    await prisma.familyMember.update({
      where: { id: familyMemberId },
      data: { faceEnrollmentStatus: 'ENROLLED' },
    });

    void createAuditLog({
      adminId: req.user?.adminId,
      action: 'ENROLL_FACE',
      targetType: 'FAMILY_MEMBER',
      targetId: familyMemberId,
      details: { memberId: member.memberId, name: member.name, profileId: faceProfile.id },
      ipAddress: getIpAddress(req),
    });

    res.status(200).json({
      status: 'success',
      message: 'Face enrolled successfully.',
      data: {
        faceProfile: {
          id: faceProfile.id,
          enrolledAt: faceProfile.enrolledAt,
        },
      },
    });
  }
);
