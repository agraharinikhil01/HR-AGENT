import mongoose, { Schema, Document } from 'mongoose';

export type InterviewType =
  | 'HR Screening'
  | 'Technical Interview'
  | 'Assignment Review'
  | 'Managerial Interview'
  | 'Cultural Interview'
  | 'Final Interview';

export type RecommendationType =
  | 'Strong Hire'
  | 'Hire'
  | 'Neutral'
  | 'Do Not Hire'
  | 'Strong Do Not Hire';

export interface IScorecard {
  interviewerId: mongoose.Types.ObjectId;
  interviewerName: string;
  competencyRatings: Array<{
    competency: string;
    rating: number; // 1 - 5
    comment?: string;
  }>;
  overallRating: number;
  comments: string;
  recommendation: RecommendationType;
  submittedAt: Date;
}

export interface IInterview extends Document {
  orgId: mongoose.Types.ObjectId;
  applicationId: mongoose.Types.ObjectId;
  candidateId: mongoose.Types.ObjectId;
  jobId: mongoose.Types.ObjectId;
  interviewType: InterviewType;
  interviewerIds: mongoose.Types.ObjectId[];
  scheduledAt: Date;
  durationMinutes: number;
  meetingLink?: string;
  location?: string;
  instructions?: string;
  status: 'Scheduled' | 'Completed' | 'Rescheduled' | 'Cancelled';
  scorecards: IScorecard[];
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const InterviewSchema = new Schema<IInterview>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    applicationId: { type: Schema.Types.ObjectId, ref: 'Application', required: true, index: true },
    candidateId: { type: Schema.Types.ObjectId, ref: 'Candidate', required: true },
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    interviewType: {
      type: String,
      enum: [
        'HR Screening',
        'Technical Interview',
        'Assignment Review',
        'Managerial Interview',
        'Cultural Interview',
        'Final Interview',
      ],
      default: 'Technical Interview',
    },
    interviewerIds: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
    scheduledAt: { type: Date, required: true, index: true },
    durationMinutes: { type: Number, default: 45 },
    meetingLink: { type: String },
    location: { type: String },
    instructions: { type: String },
    status: {
      type: String,
      enum: ['Scheduled', 'Completed', 'Rescheduled', 'Cancelled'],
      default: 'Scheduled',
    },
    scorecards: [
      {
        interviewerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        interviewerName: { type: String, required: true },
        competencyRatings: [
          {
            competency: { type: String, required: true },
            rating: { type: Number, min: 1, max: 5, required: true },
            comment: { type: String },
          },
        ],
        overallRating: { type: Number, min: 1, max: 5, required: true },
        comments: { type: String, required: true },
        recommendation: {
          type: String,
          enum: ['Strong Hire', 'Hire', 'Neutral', 'Do Not Hire', 'Strong Do Not Hire'],
          required: true,
        },
        submittedAt: { type: Date, default: Date.now },
      },
    ],
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

InterviewSchema.index({ orgId: 1, scheduledAt: 1 });

export const Interview = mongoose.model<IInterview>('Interview', InterviewSchema);
