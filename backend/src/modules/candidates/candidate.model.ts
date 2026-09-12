import mongoose, { Schema, Document } from 'mongoose';

export interface ICandidate extends Document {
  orgId: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
  phone?: string;
  currentCity?: string;
  preferredLocation?: string;
  currentCompany?: string;
  currentDesignation?: string;
  totalExperienceYears: number;
  relevantExperienceYears?: number;
  currentSalary?: number;
  expectedSalary?: number;
  noticePeriodDays: number;
  skills: string[];
  education: string[];
  certifications: string[];
  projects: string[];
  linkedInUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  resumeUrl?: string;
  resumeOriginalName?: string;
  resumeBase64?: string;
  resumeMimeType?: string;
  resumeSizeBytes?: number;
  resumeUploadedAt?: Date;
  parsedText?: string;
  atsScore?: number;
  atsGrade?: string;
  atsBreakdown?: {
    skillsScore: number;
    experienceScore: number;
    contactScore: number;
    formattingScore: number;
  };
  atsStrengths?: string[];
  atsImprovements?: string[];
  source: 'PUBLIC_APPLICATION' | 'DIRECT_UPLOAD' | 'BULK_UPLOAD' | 'REFERRAL' | 'AGENCY';
  duplicateFlags: Array<{
    candidateId: mongoose.Types.ObjectId;
    reason: 'email' | 'phone' | 'name';
    flaggedAt: Date;
  }>;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CandidateSchema = new Schema<ICandidate>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    phone: { type: String, trim: true },
    currentCity: { type: String, trim: true },
    preferredLocation: { type: String, trim: true },
    currentCompany: { type: String, trim: true },
    currentDesignation: { type: String, trim: true },
    totalExperienceYears: { type: Number, default: 0 },
    relevantExperienceYears: { type: Number, default: 0 },
    currentSalary: { type: Number },
    expectedSalary: { type: Number },
    noticePeriodDays: { type: Number, default: 30 },
    skills: [{ type: String, trim: true }],
    education: [{ type: String, trim: true }],
    certifications: [{ type: String, trim: true }],
    projects: [{ type: String, trim: true }],
    linkedInUrl: { type: String, trim: true },
    githubUrl: { type: String, trim: true },
    portfolioUrl: { type: String, trim: true },
    resumeUrl: { type: String },
    resumeOriginalName: { type: String },
    resumeBase64: { type: String },
    resumeMimeType: { type: String, default: 'application/pdf' },
    resumeSizeBytes: { type: Number },
    resumeUploadedAt: { type: Date },
    parsedText: { type: String },
    atsScore: { type: Number, default: 0 },
    atsGrade: { type: String, default: 'A' },
    atsBreakdown: {
      skillsScore: { type: Number, default: 0 },
      experienceScore: { type: Number, default: 0 },
      contactScore: { type: Number, default: 0 },
      formattingScore: { type: Number, default: 0 },
    },
    atsStrengths: [{ type: String }],
    atsImprovements: [{ type: String }],
    source: {
      type: String,
      enum: ['PUBLIC_APPLICATION', 'DIRECT_UPLOAD', 'BULK_UPLOAD', 'REFERRAL', 'AGENCY'],
      default: 'DIRECT_UPLOAD',
    },
    duplicateFlags: [
      {
        candidateId: { type: Schema.Types.ObjectId, ref: 'Candidate' },
        reason: { type: String, enum: ['email', 'phone', 'name'] },
        flaggedAt: { type: Date, default: Date.now },
      },
    ],
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

CandidateSchema.index({ orgId: 1, email: 1 });
CandidateSchema.index({ orgId: 1, phone: 1 });
CandidateSchema.index({ fullName: 'text', skills: 'text', currentCompany: 'text' });

export const Candidate = mongoose.model<ICandidate>('Candidate', CandidateSchema);
