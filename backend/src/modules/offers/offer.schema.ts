import { z } from 'zod';

export const createOfferSchema = z.object({
  applicationId: z.string().min(1, 'Application ID is required'),
  templateType: z.enum(['Full-time', 'Intern', 'Consultant', 'Leadership']).default('Full-time'),
  joiningDate: z.string().min(1, 'Joining date is required'),
  validUntil: z.string().min(1, 'Offer validity date is required'),
  reportingManager: z.string().min(2, 'Reporting manager is required'),
  workLocation: z.string().default('Bengaluru, India'),
  probationPeriodMonths: z.number().int().nonnegative().default(3),
  noticePeriodDays: z.number().int().nonnegative().default(30),
  annualCtc: z.number().positive('Annual CTC must be greater than 0'),
  basicPercentage: z.number().min(20).max(70).default(50),
  hraPercentage: z.number().min(20).max(60).default(40),
  variableAnnual: z.number().nonnegative().default(0),
  includePf: z.boolean().default(true),
  includeGratuity: z.boolean().default(true),
  additionalBenefits: z.array(z.string()).default([]),
  termsAndConditions: z.string().optional(),
});

export const approveOfferSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED', 'CHANGES_REQUESTED']),
  comments: z.string().optional(),
});

export const candidateAcceptRejectSchema = z.object({
  action: z.enum(['ACCEPT', 'REJECT', 'CLARIFICATION']),
  signature: z.string().optional(),
  comments: z.string().optional(),
});
