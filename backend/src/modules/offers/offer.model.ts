import mongoose, { Schema, Document } from 'mongoose';

export type OfferStatus =
  | 'Draft'
  | 'Pending Approval'
  | 'Changes Requested'
  | 'Approved'
  | 'Sent'
  | 'Viewed'
  | 'Accepted'
  | 'Rejected'
  | 'Expired'
  | 'Withdrawn'
  | 'Revised';

export interface IOfferApproval {
  level: number; // 1: Hiring Manager, 2: Finance, 3: HR Head
  role: 'HIRING_MANAGER' | 'FINANCE_APPROVER' | 'ORG_ADMIN';
  approverId?: mongoose.Types.ObjectId;
  approverName?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED';
  comments?: string;
  decisionAt?: Date;
}

export interface IOffer extends Document {
  orgId: mongoose.Types.ObjectId;
  applicationId: mongoose.Types.ObjectId;
  candidateId: mongoose.Types.ObjectId;
  jobId: mongoose.Types.ObjectId;
  version: number;
  templateType: 'Full-time' | 'Intern' | 'Consultant' | 'Leadership';
  joiningDate: Date;
  validUntil: Date;
  reportingManager: string;
  workLocation: string;
  probationPeriodMonths: number;
  noticePeriodDays: number;
  // Indian CTC Compensation Breakdown
  annualCtc: number;
  monthlyCtc: number;
  annualGross: number;
  monthlyGross: number;
  components: {
    basicAnnual: number;
    basicMonthly: number;
    hraAnnual: number;
    hraMonthly: number;
    specialAllowanceAnnual: number;
    specialAllowanceMonthly: number;
    variableAnnual: number;
    variableMonthly: number;
    employerPfAnnual: number;
    employerPfMonthly: number;
    gratuityAnnual: number;
    gratuityMonthly: number;
  };
  additionalBenefits?: string[];
  termsAndConditions?: string;
  // Multi-step approvals
  approvalChain: IOfferApproval[];
  status: OfferStatus;
  // Candidate Secure Portal
  candidatePortalToken: string;
  sentAt?: Date;
  firstViewedAt?: Date;
  lastViewedAt?: Date;
  acceptedAt?: Date;
  rejectedAt?: Date;
  candidateSignature?: string;
  candidateNotes?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const OfferSchema = new Schema<IOffer>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    applicationId: { type: Schema.Types.ObjectId, ref: 'Application', required: true, index: true },
    candidateId: { type: Schema.Types.ObjectId, ref: 'Candidate', required: true },
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    version: { type: Number, default: 1 },
    templateType: {
      type: String,
      enum: ['Full-time', 'Intern', 'Consultant', 'Leadership'],
      default: 'Full-time',
    },
    joiningDate: { type: Date, required: true },
    validUntil: { type: Date, required: true },
    reportingManager: { type: String, required: true },
    workLocation: { type: String, default: 'Bengaluru, India' },
    probationPeriodMonths: { type: Number, default: 3 },
    noticePeriodDays: { type: Number, default: 30 },
    annualCtc: { type: Number, required: true },
    monthlyCtc: { type: Number, required: true },
    annualGross: { type: Number, required: true },
    monthlyGross: { type: Number, required: true },
    components: {
      basicAnnual: { type: Number, required: true },
      basicMonthly: { type: Number, required: true },
      hraAnnual: { type: Number, required: true },
      hraMonthly: { type: Number, required: true },
      specialAllowanceAnnual: { type: Number, required: true },
      specialAllowanceMonthly: { type: Number, required: true },
      variableAnnual: { type: Number, default: 0 },
      variableMonthly: { type: Number, default: 0 },
      employerPfAnnual: { type: Number, default: 0 },
      employerPfMonthly: { type: Number, default: 0 },
      gratuityAnnual: { type: Number, default: 0 },
      gratuityMonthly: { type: Number, default: 0 },
    },
    additionalBenefits: [{ type: String }],
    termsAndConditions: { type: String },
    approvalChain: [
      {
        level: { type: Number, required: true },
        role: {
          type: String,
          enum: ['HIRING_MANAGER', 'FINANCE_APPROVER', 'ORG_ADMIN'],
          required: true,
        },
        approverId: { type: Schema.Types.ObjectId, ref: 'User' },
        approverName: { type: String },
        status: {
          type: String,
          enum: ['PENDING', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED'],
          default: 'PENDING',
        },
        comments: { type: String },
        decisionAt: { type: Date },
      },
    ],
    status: {
      type: String,
      enum: [
        'Draft',
        'Pending Approval',
        'Changes Requested',
        'Approved',
        'Sent',
        'Viewed',
        'Accepted',
        'Rejected',
        'Expired',
        'Withdrawn',
        'Revised',
      ],
      default: 'Draft',
      index: true,
    },
    candidatePortalToken: { type: String, required: true, unique: true, index: true },
    sentAt: { type: Date },
    firstViewedAt: { type: Date },
    lastViewedAt: { type: Date },
    acceptedAt: { type: Date },
    rejectedAt: { type: Date },
    candidateSignature: { type: String },
    candidateNotes: { type: String },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

OfferSchema.index({ orgId: 1, status: 1 });

export const Offer = mongoose.model<IOffer>('Offer', OfferSchema);
