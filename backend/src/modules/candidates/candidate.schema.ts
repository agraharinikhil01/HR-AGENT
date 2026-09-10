import { z } from 'zod';

export const createCandidateSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Valid email is required').toLowerCase(),
  phone: z.string().optional(),
  currentCity: z.string().optional(),
  preferredLocation: z.string().optional(),
  currentCompany: z.string().optional(),
  currentDesignation: z.string().optional(),
  totalExperienceYears: z.number().nonnegative().default(0),
  relevantExperienceYears: z.number().nonnegative().optional(),
  currentSalary: z.number().nonnegative().optional(),
  expectedSalary: z.number().nonnegative().optional(),
  noticePeriodDays: z.number().int().nonnegative().default(30),
  skills: z.array(z.string()).default([]),
  education: z.array(z.string()).default([]),
  certifications: z.array(z.string()).default([]),
  projects: z.array(z.string()).default([]),
  linkedInUrl: z.string().url().optional().or(z.literal('')),
  githubUrl: z.string().url().optional().or(z.literal('')),
  portfolioUrl: z.string().url().optional().or(z.literal('')),
  resumeUrl: z.string().optional(),
  resumeOriginalName: z.string().optional(),
  parsedText: z.string().optional(),
  jobId: z.string().min(1, 'Target job opening ID is required'),
  source: z.enum(['PUBLIC_APPLICATION', 'DIRECT_UPLOAD', 'BULK_UPLOAD', 'REFERRAL', 'AGENCY']).default('DIRECT_UPLOAD'),
});

export const publicApplySchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Valid email is required').toLowerCase(),
  phone: z.string().min(8, 'Phone number is required'),
  currentCity: z.string().optional(),
  currentCompany: z.string().optional(),
  currentDesignation: z.string().optional(),
  totalExperienceYears: z.number().nonnegative().default(0),
  expectedSalary: z.number().nonnegative().optional(),
  noticePeriodDays: z.number().int().nonnegative().default(30),
  skills: z.array(z.string()).default([]),
  education: z.array(z.string()).default([]),
  linkedInUrl: z.string().optional(),
  githubUrl: z.string().optional(),
  portfolioUrl: z.string().optional(),
  resumeText: z.string().optional(),
  jobId: z.string().optional(),
  password: z.string().min(6).optional(),
});

export const updateCandidateProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.string().optional(),
  currentCity: z.string().optional(),
  currentCompany: z.string().optional(),
  currentDesignation: z.string().optional(),
  totalExperienceYears: z.number().nonnegative().optional(),
  skills: z.array(z.string()).optional(),
  education: z.array(z.string()).optional(),
  linkedInUrl: z.string().optional(),
  githubUrl: z.string().optional(),
  portfolioUrl: z.string().optional(),
  parsedText: z.string().optional(),
});

export const respondOfferSchema = z.object({
  decision: z.enum(['ACCEPTED', 'DECLINED']),
  reason: z.string().optional(),
});

export const updateStageSchema = z.object({
  stage: z.enum([
    'Applied',
    'AI Reviewed',
    'Recruiter Review',
    'Shortlisted',
    'Screening Call',
    'Interview',
    'Assessment',
    'Final Interview',
    'Offer Approval',
    'Offer Sent',
    'Offer Accepted',
    'Joined',
    'On Hold',
    'Rejected',
    'Candidate Withdrew',
    'Offer Declined',
  ]),
  note: z.string().optional(),
});

export const overrideScoreSchema = z.object({
  overrideScore: z.number().min(0).max(100),
  reason: z.string().min(5, 'A detailed override reason is required'),
});

export const addNoteSchema = z.object({
  text: z.string().min(1, 'Note content is required'),
  isPrivate: z.boolean().default(false),
});
