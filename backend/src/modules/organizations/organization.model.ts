import mongoose, { Schema, Document } from 'mongoose';

export interface IOrganization extends Document {
  name: string;
  slug: string;
  logo?: string;
  industry: string;
  size: string;
  website?: string;
  address?: string;
  country: string;
  timezone: string;
  currency: string;
  retentionPeriodMonths: number;
  departments: Array<{ _id: mongoose.Types.ObjectId; name: string; headId?: mongoose.Types.ObjectId }>;
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema = new Schema<IOrganization>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    logo: { type: String },
    industry: { type: String, default: 'Technology' },
    size: { type: String, default: '10-50' },
    website: { type: String },
    address: { type: String },
    country: { type: String, default: 'India' },
    timezone: { type: String, default: 'Asia/Kolkata' },
    currency: { type: String, default: 'INR' },
    retentionPeriodMonths: { type: Number, default: 12 },
    departments: [
      {
        name: { type: String, required: true },
        headId: { type: Schema.Types.ObjectId, ref: 'User' },
      },
    ],
  },
  { timestamps: true }
);

export const Organization = mongoose.model<IOrganization>('Organization', OrganizationSchema);
