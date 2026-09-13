import { z } from 'zod';

export const adminLoginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const userLoginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, 'Old password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Confirm password is required'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New password and confirm password do not match',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  emailOrUsername: z.string().min(1, 'Email or username is required'),
});

export const createFamilySchema = z.object({
  familyId: z.string().min(1, 'Family ID is required').max(30, 'Family ID must be at most 30 characters'),
  headName: z.string().min(1, 'Head name is required').max(150, 'Head name must be at most 150 characters'),
  mobileNumber: z.string().min(1, 'Mobile number is required').max(20, 'Mobile number must be at most 20 characters'),
  address: z.string().min(1, 'Address is required'),
  username: z.string().min(1, 'Username is required').max(50, 'Username must be at most 50 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  memberCount: z.number().int().positive('Member count must be a positive integer'),
});

export const updateFamilySchema = z.object({
  headName: z.string().min(1, 'Head name is required').max(150, 'Head name must be at most 150 characters').optional(),
  mobileNumber: z.string().min(1, 'Mobile number is required').max(20, 'Mobile number must be at most 20 characters').optional(),
  address: z.string().min(1, 'Address is required').optional(),
  isActive: z.boolean().optional(),
});

export const createMemberSchema = z.object({
  name: z.string().min(1, 'Name is required').max(150, 'Name must be at most 150 characters'),
  age: z.number().int().nonnegative('Age must be a non-negative integer').optional(),
  gender: z.string().max(10, 'Gender must be at most 10 characters').optional(),
  relation: z.string().min(1, 'Relation is required').max(50, 'Relation must be at most 50 characters'),
  isFamilyHead: z.boolean().default(false),
  accountStatus: z.string().default('ACTIVE'),
});

export const updateMemberSchema = z.object({
  name: z.string().min(1, 'Name is required').max(150, 'Name must be at most 150 characters').optional(),
  age: z.number().int().nonnegative('Age must be a non-negative integer').optional(),
  gender: z.string().max(10, 'Gender must be at most 10 characters').optional(),
  relation: z.string().min(1, 'Relation is required').max(50, 'Relation must be at most 50 characters').optional(),
  isFamilyHead: z.boolean().optional(),
  accountStatus: z.string().optional(),
});

export const createRiceEntitlementSchema = z.object({
  familyId: z.number().int().positive('Family ID must be a positive integer'),
  monthlyQuotaKg: z.number().positive('Monthly quota must be a positive number'),
  unitPerMemberKg: z.number().positive('Unit per member must be a positive number'),
});

export const distributeRiceSchema = z.object({
  familyId: z.number().int().positive('Family ID must be a positive integer'),
  distributedKg: z.number().positive('Distributed kg must be a positive number'),
  notes: z.string().optional(),
});

export const faceVerifySchema = z.object({
  username: z.string().min(1, 'Username is required'),
  imageBase64: z.string().optional(),
});
