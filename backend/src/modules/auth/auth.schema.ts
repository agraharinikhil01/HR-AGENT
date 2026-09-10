import { z } from 'zod';

export const registerOrgSchema = z.object({
  organizationName: z.string().min(2, 'Organization name must be at least 2 characters').max(100),
  industry: z.string().default('Technology'),
  adminName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address').toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const inviteUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address').toLowerCase(),
  role: z.enum([
    'ORG_ADMIN',
    'RECRUITER',
    'HIRING_MANAGER',
    'INTERVIEWER',
    'FINANCE_APPROVER',
  ]),
  department: z.string().optional(),
});

export const acceptInviteSchema = z.object({
  token: z.string().min(1, 'Invitation token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
