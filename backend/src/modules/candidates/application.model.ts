import mongoose, { Schema, Document } from 'mongoose';

export type PipelineStage =
  | 'Applied'
  | 'AI Reviewed'
  | 'Recruiter Review'
  | 'Shortlisted'
  | 'Screening Call'
  | 'Interview'
  | 'Assessment'
  | 'Final Interview'
  | 'Offer Approval'
  | 'Offer Sent'
  | 'Offer Accepted'
  | 'Joined'
  | 'On Hold'
  | 'Rejected'
  | 'Candidate Withdrew'
  | 'Offer Declined';

export interface IApplication extends Document {
  orgId: mongoose.Types.ObjectId;
  candidateId: mongoose.Types.ObjectId;
  jobId: mongoose.Types.ObjectId;
  stage: PipelineStage;
  stageHistory: Array<{
    stage: PipelineStage;
    changedBy?: mongoose.Types.ObjectId;
    note?: string;
    changedAt: Date;
  }>;
  fitScore: number;
  eligibilityStatus: 'PASSED' | 'FAILED' | 'REVIEW_REQUIRED';
  categoryScores: {
    mandatorySkills: number;
    relevantExperience: number;
    roleIndustryMatch: number;
    preferredSkills: number;
    educationCertifications: number;
    projectRelevance: number;
    availabilityNoticePeriod: number;
  };
  strengths: string[];
  concerns: string[];
  missingInformation: string[];
  humanOverride?: {
    isOverridden: boolean;
    originalScore: number;
    overrideScore: number;
    reason: string;
    overriddenBy: mongoose.Types.ObjectId;
    overriddenAt: Date;
  };
  notes: Array<{
    _id: mongoose.Types.ObjectId;
    authorId: mongoose.Types.ObjectId;
    authorName: string;
    text: string;
    isPrivate?: boolean;
    createdAt: Date;
  }>;
  tags: string[];
  status: 'ACTIVE' | 'ARCHIVED' | 'HIRED' | 'REJECTED';
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ApplicationSchema = new Schema<IApplication>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    candidateId: { type: Schema.Types.ObjectId, ref: 'Candidate', required: true, index: true },
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
    stage: {
      type: String,
      enum: [
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
      ],
      default: 'Applied',
      index: true,
    },
    stageHistory: [
      {
        stage: { type: String, required: true },
        changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        note: { type: String },
        changedAt: { type: Date, default: Date.now },
      },
    ],
    fitScore: { type: Number, default: 0, min: 0, max: 100, index: true },
    eligibilityStatus: {
      type: String,
      enum: ['PASSED', 'FAILED', 'REVIEW_REQUIRED'],
      default: 'REVIEW_REQUIRED',
    },
    categoryScores: {
      mandatorySkills: { type: Number, default: 0 },
      relevantExperience: { type: Number, default: 0 },
      roleIndustryMatch: { type: Number, default: 0 },
      preferredSkills: { type: Number, default: 0 },
      educationCertifications: { type: Number, default: 0 },
      projectRelevance: { type: Number, default: 0 },
      availabilityNoticePeriod: { type: Number, default: 0 },
    },
    strengths: [{ type: String }],
    concerns: [{ type: String }],
    missingInformation: [{ type: String }],
    humanOverride: {
      isOverridden: { type: Boolean, default: false },
      originalScore: { type: Number },
      overrideScore: { type: Number },
      reason: { type: String },
      overriddenBy: { type: Schema.Types.ObjectId, ref: 'User' },
      overriddenAt: { type: Date },
    },
    notes: [
      {
        authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        authorName: { type: String, required: true },
        text: { type: String, required: true },
        isPrivate: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    tags: [{ type: String }],
    status: {
      type: String,
      enum: ['ACTIVE', 'ARCHIVED', 'HIRED', 'REJECTED'],
      default: 'ACTIVE',
    },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

ApplicationSchema.index({ orgId: 1, jobId: 1, stage: 1 });
ApplicationSchema.index({ orgId: 1, candidateId: 1, jobId: 1 }, { unique: true });

export const Application = mongoose.model<IApplication>('Application', ApplicationSchema);
