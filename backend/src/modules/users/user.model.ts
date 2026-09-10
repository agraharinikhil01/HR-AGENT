import mongoose, { Schema, Document } from 'mongoose';

export type UserRole =
  | 'SUPER_ADMIN'
  | 'ORG_ADMIN'
  | 'RECRUITER'
  | 'HIRING_MANAGER'
  | 'INTERVIEWER'
  | 'FINANCE_APPROVER'
  | 'CANDIDATE';

export interface IRefreshToken {
  tokenHash: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface IUser extends Document {
  orgId: mongoose.Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  department?: string;
  status: 'ACTIVE' | 'INVITED' | 'DISABLED';
  invitationToken?: string;
  invitationExpiresAt?: Date;
  refreshTokens: IRefreshToken[];
  failedLoginAttempts: number;
  lockUntil?: Date;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: [
        'SUPER_ADMIN',
        'ORG_ADMIN',
        'RECRUITER',
        'HIRING_MANAGER',
        'INTERVIEWER',
        'FINANCE_APPROVER',
        'CANDIDATE',
      ],
      default: 'RECRUITER',
      required: true,
    },
    department: { type: String },
    status: { type: String, enum: ['ACTIVE', 'INVITED', 'DISABLED'], default: 'ACTIVE' },
    invitationToken: { type: String },
    invitationExpiresAt: { type: Date },
    refreshTokens: [
      {
        tokenHash: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
        expiresAt: { type: Date, required: true },
      },
    ],
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Compound unique index on email + orgId
UserSchema.index({ email: 1, orgId: 1 }, { unique: true });

export const User = mongoose.model<IUser>('User', UserSchema);
