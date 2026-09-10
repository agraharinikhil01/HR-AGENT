import mongoose from 'mongoose';
import { AuditLog } from './audit.model.js';

export interface LogAuditParams {
  orgId: string;
  userId?: string;
  userName?: string;
  action: string;
  entityType: string;
  entityId: string;
  previousValue?: any;
  newValue?: any;
  ipAddress?: string;
}

export async function logAudit(params: LogAuditParams): Promise<void> {
  try {
    await AuditLog.create({
      orgId: new mongoose.Types.ObjectId(params.orgId),
      userId: params.userId ? new mongoose.Types.ObjectId(params.userId) : undefined,
      userName: params.userName,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      previousValue: params.previousValue,
      newValue: params.newValue,
      ipAddress: params.ipAddress,
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}
