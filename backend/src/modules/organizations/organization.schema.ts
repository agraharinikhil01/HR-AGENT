import { z } from 'zod';

export const updateOrgSchema = z.object({
  name: z.string().min(2).optional(),
  logo: z.string().url().optional(),
  industry: z.string().optional(),
  size: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  address: z.string().optional(),
  country: z.string().optional(),
  timezone: z.string().optional(),
  currency: z.string().default('INR'),
  retentionPeriodMonths: z.number().int().positive().optional(),
});

export const addDepartmentSchema = z.object({
  name: z.string().min(1, 'Department name is required'),
  headId: z.string().optional(),
});

export const inviteMemberSchema = z.object({
  name: z.string().min(2, 'Name is required'),
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
