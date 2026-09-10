import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { Organization } from './organization.model.js';
import { User, UserRole } from '../users/user.model.js';
import { logAudit } from '../audit/audit.service.js';
import { sendEmail } from '../../services/email.service.js';
import { env } from '../../config/env.js';

export class OrganizationService {
  static async getDetails(orgId: string) {
    const org = await Organization.findById(orgId);
    if (!org) {
      const err: any = new Error('Organization not found');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }
    return org;
  }

  static async updateDetails(orgId: string, data: any, actor: { id: string; name: string; ip?: string }) {
    const org = await Organization.findById(orgId);
    if (!org) {
      const err: any = new Error('Organization not found');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    const previousValue = org.toObject();
    Object.assign(org, data);
    await org.save();

    await logAudit({
      orgId,
      userId: actor.id,
      userName: actor.name,
      action: 'ORGANIZATION_UPDATED',
      entityType: 'Organization',
      entityId: orgId,
      previousValue,
      newValue: org.toObject(),
      ipAddress: actor.ip,
    });

    return org;
  }

  static async addDepartment(orgId: string, name: string, headId?: string) {
    const org = await Organization.findById(orgId);
    if (!org) {
      const err: any = new Error('Organization not found');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    const newDept = {
      _id: new mongoose.Types.ObjectId(),
      name,
      headId: headId ? new mongoose.Types.ObjectId(headId) : undefined,
    };

    org.departments.push(newDept as any);
    await org.save();
    return org.departments;
  }

  static async listMembers(orgId: string) {
    return User.find({ orgId, isDeleted: false })
      .select('-passwordHash -refreshTokens')
      .sort({ createdAt: -1 });
  }

  static async inviteMember(
    orgId: string,
    data: { name: string; email: string; role: UserRole; department?: string },
    actor: { id: string; name: string; ip?: string }
  ) {
    const existing = await User.findOne({ orgId, email: data.email, isDeleted: false });
    if (existing) {
      const err: any = new Error('A member with this email already exists in this organization');
      err.statusCode = 409;
      err.code = 'CONFLICT';
      throw err;
    }

    const invitationToken = crypto.randomBytes(32).toString('hex');
    const invitationExpiresAt = new Date();
    invitationExpiresAt.setDate(invitationExpiresAt.getDate() + 3); // 3 days validity

    // Generate random temporary password hash (user sets their own on acceptance)
    const tempPassword = await bcrypt.hash(crypto.randomBytes(24).toString('hex'), 10);

    const user = await User.create({
      orgId: new mongoose.Types.ObjectId(orgId),
      name: data.name,
      email: data.email,
      passwordHash: tempPassword,
      role: data.role,
      department: data.department,
      status: 'INVITED',
      invitationToken,
      invitationExpiresAt,
    });

    const inviteUrl = `${env.CLIENT_URL}/accept-invite?token=${invitationToken}`;

    // Send invitation email asynchronously
    sendEmail({
      to: data.email,
      subject: `You've been invited to join HireFlow AI`,
      text: `Hello ${data.name},\n\nYou have been invited by ${actor.name} to join HireFlow AI as ${data.role}.\n\nPlease click the link below to set up your account:\n${inviteUrl}\n\nThis invitation will expire in 3 days.`,
      html: `<h3>Welcome to HireFlow AI</h3><p>Hello <b>${data.name}</b>,</p><p>You have been invited by ${actor.name} to join as <b>${data.role}</b>.</p><p><a href="${inviteUrl}" style="display:inline-block;background:#4F46E5;color:#fff;padding:10px 18px;text-decoration:none;border-radius:6px;">Accept Invitation</a></p><p>Or copy this URL into your browser: <br>${inviteUrl}</p>`,
    }).catch((e) => console.error('Error sending invite email:', e));

    await logAudit({
      orgId,
      userId: actor.id,
      userName: actor.name,
      action: 'TEAM_MEMBER_INVITED',
      entityType: 'User',
      entityId: user._id.toString(),
      newValue: { email: data.email, role: data.role },
      ipAddress: actor.ip,
    });

    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      status: user.status,
      invitationExpiresAt: user.invitationExpiresAt,
      inviteUrl, // Expose for easy testing / copy-link
    };
  }

  static async acceptInvite(token: string, newPassword: string) {
    const user = await User.findOne({
      invitationToken: token,
      invitationExpiresAt: { $gt: new Date() },
      status: 'INVITED',
      isDeleted: false,
    });

    if (!user) {
      const err: any = new Error('Invitation is invalid or has expired');
      err.statusCode = 400;
      err.code = 'INVALID_REQUEST';
      throw err;
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.status = 'ACTIVE';
    user.invitationToken = undefined;
    user.invitationExpiresAt = undefined;
    await user.save();

    return { message: 'Invitation accepted successfully. You can now log in.' };
  }
}
