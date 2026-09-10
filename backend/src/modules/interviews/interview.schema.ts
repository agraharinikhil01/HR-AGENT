import { z } from 'zod';

export const scheduleInterviewSchema = z.object({
  applicationId: z.string().min(1, 'Application ID is required'),
  interviewType: z.enum([
    'HR Screening',
    'Technical Interview',
    'Assignment Review',
    'Managerial Interview',
    'Cultural Interview',
    'Final Interview',
  ]),
  interviewerIds: z.array(z.string()).min(1, 'At least one interviewer is required'),
  scheduledAt: z.string().datetime().or(z.string().min(1)),
  durationMinutes: z.number().int().positive().default(45),
  meetingLink: z.string().url().optional().or(z.literal('')),
  location: z.string().optional(),
  instructions: z.string().optional(),
});

export const submitScorecardSchema = z.object({
  competencyRatings: z
    .array(
      z.object({
        competency: z.string().min(1, 'Competency name is required'),
        rating: z.number().min(1).max(5),
        comment: z.string().optional(),
      })
    )
    .min(1, 'At least one competency rating is required'),
  overallRating: z.number().min(1).max(5),
  comments: z.string().min(5, 'Detailed interview feedback is required'),
  recommendation: z.enum([
    'Strong Hire',
    'Hire',
    'Neutral',
    'Do Not Hire',
    'Strong Do Not Hire',
  ]),
});
