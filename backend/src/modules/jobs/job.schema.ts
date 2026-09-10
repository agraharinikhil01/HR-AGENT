import { z } from 'zod';

export const createJobSchema = z.object({
  title: z.string().min(2, 'Job title is required'),
  department: z.string().optional(),
  hiringManagerId: z.string().optional(),
  employmentType: z.enum(['Full-time', 'Part-time', 'Contract', 'Intern']).default('Full-time'),
  workplaceType: z.enum(['On-site', 'Hybrid', 'Remote']).default('Hybrid'),
  location: z.string().default('Bengaluru, India'),
  vacancies: z.number().int().positive().default(1),
  minExperienceYears: z.number().nonnegative().default(2),
  maxExperienceYears: z.number().nonnegative().optional(),
  minSalary: z.number().nonnegative().optional(),
  maxSalary: z.number().nonnegative().optional(),
  currency: z.string().default('INR'),
  deadline: z.string().optional(),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  responsibilities: z.array(z.string()).default([]),
  mandatorySkills: z.array(z.string()).min(1, 'At least one mandatory skill is required'),
  preferredSkills: z.array(z.string()).default([]),
  educationRequirements: z.array(z.string()).default([]),
  noticePeriodPreferenceDays: z.number().int().nonnegative().default(30),
  screeningQuestions: z
    .array(
      z.object({
        question: z.string(),
        type: z.enum(['text', 'yes_no', 'number']).default('text'),
        required: z.boolean().default(false),
      })
    )
    .default([]),
});

export const updateJobSchema = createJobSchema.partial().extend({
  status: z
    .enum(['Draft', 'Awaiting approval', 'Open', 'Paused', 'Closed', 'Filled', 'Archived'])
    .optional(),
});

export const aiGenerateJdSchema = z.object({
  title: z.string().min(2),
  industry: z.string().default('Technology'),
  experienceLevel: z.string().default('Mid-level (3-5 years)'),
  requiredSkills: z.array(z.string()).default([]),
  workplaceType: z.string().default('Hybrid'),
});
