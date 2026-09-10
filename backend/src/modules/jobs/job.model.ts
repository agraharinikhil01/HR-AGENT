import mongoose, { Schema, Document } from 'mongoose';

export type JobStatus =
  | 'Draft'
  | 'Awaiting approval'
  | 'Open'
  | 'Paused'
  | 'Closed'
  | 'Filled'
  | 'Archived';

export interface IJobRequirement {
  name: string;
  type: 'mandatory' | 'preferred' | 'optional' | 'disqualifying';
  category: 'skill' | 'experience' | 'education' | 'notice_period' | 'location' | 'other';
  expectedValue?: string | number;
}

export interface IJob extends Document {
  orgId: mongoose.Types.ObjectId;
  title: string;
  slug: string;
  department?: string;
  hiringManagerId?: mongoose.Types.ObjectId;
  recruiterId: mongoose.Types.ObjectId;
  employmentType: 'Full-time' | 'Part-time' | 'Contract' | 'Intern';
  workplaceType: 'On-site' | 'Hybrid' | 'Remote';
  location: string;
  vacancies: number;
  minExperienceYears: number;
  maxExperienceYears?: number;
  minSalary?: number;
  maxSalary?: number;
  currency: string;
  deadline?: Date;
  description: string;
  responsibilities: string[];
  mandatorySkills: string[];
  preferredSkills: string[];
  educationRequirements: string[];
  noticePeriodPreferenceDays: number;
  screeningQuestions: Array<{
    question: string;
    type: 'text' | 'yes_no' | 'number';
    required: boolean;
  }>;
  status: JobStatus;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema = new Schema<IJob>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    department: { type: String, trim: true },
    hiringManagerId: { type: Schema.Types.ObjectId, ref: 'User' },
    recruiterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    employmentType: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Contract', 'Intern'],
      default: 'Full-time',
    },
    workplaceType: {
      type: String,
      enum: ['On-site', 'Hybrid', 'Remote'],
      default: 'Hybrid',
    },
    location: { type: String, default: 'Bengaluru, India' },
    vacancies: { type: Number, default: 1 },
    minExperienceYears: { type: Number, default: 2 },
    maxExperienceYears: { type: Number },
    minSalary: { type: Number },
    maxSalary: { type: Number },
    currency: { type: String, default: 'INR' },
    deadline: { type: Date },
    description: { type: String, required: true },
    responsibilities: [{ type: String }],
    mandatorySkills: [{ type: String, index: true }],
    preferredSkills: [{ type: String }],
    educationRequirements: [{ type: String }],
    noticePeriodPreferenceDays: { type: Number, default: 30 },
    screeningQuestions: [
      {
        question: { type: String, required: true },
        type: { type: String, enum: ['text', 'yes_no', 'number'], default: 'text' },
        required: { type: Boolean, default: false },
      },
    ],
    status: {
      type: String,
      enum: ['Draft', 'Awaiting approval', 'Open', 'Paused', 'Closed', 'Filled', 'Archived'],
      default: 'Open',
      index: true,
    },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

// Compound index for unique slug per organization
JobSchema.index({ orgId: 1, slug: 1 }, { unique: true });
// Full-text search index on title, description, and skills per PRD Section 15 & Blueprint
JobSchema.index({ title: 'text', description: 'text', mandatorySkills: 'text', preferredSkills: 'text' });

export const Job = mongoose.model<IJob>('Job', JobSchema);
