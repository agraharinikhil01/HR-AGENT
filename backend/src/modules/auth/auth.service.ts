import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { User, IUser, UserRole } from '../users/user.model.js';
import { Organization } from '../organizations/organization.model.js';
import { Candidate } from '../candidates/candidate.model.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt.js';
import { logAudit } from '../audit/audit.service.js';
import { Otp } from './otp.model.js';
import { sendEmail } from '../../services/email.service.js';
import { env } from '../../config/env.js';

export class AuthService {
  static async registerOrgAndAdmin(data: {
    organizationName: string;
    industry: string;
    adminName: string;
    email: string;
    password: string;
    ipAddress?: string;
  }) {
    const slug = data.organizationName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') + '-' + crypto.randomBytes(3).toString('hex');

    // Create Organization
    const organization = await Organization.create({
      name: data.organizationName,
      slug,
      industry: data.industry,
      departments: [
        { name: 'Engineering' },
        { name: 'Human Resources' },
        { name: 'Product' },
        { name: 'Sales & Marketing' },
        { name: 'Finance' },
      ],
    });

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await User.create({
      orgId: organization._id,
      name: data.adminName,
      email: data.email,
      passwordHash,
      role: 'ORG_ADMIN',
      status: 'ACTIVE',
    });

    const payload = {
      userId: user._id.toString(),
      orgId: organization._id.toString(),
      role: user.role,
    };

    const accessToken = signAccessToken(payload);
    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const refreshHash = await bcrypt.hash(rawRefreshToken, 10);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    user.refreshTokens.push({
      tokenHash: refreshHash,
      createdAt: new Date(),
      expiresAt,
    });
    await user.save();

    await logAudit({
      orgId: organization._id.toString(),
      userId: user._id.toString(),
      userName: user.name,
      action: 'ORGANIZATION_REGISTERED',
      entityType: 'Organization',
      entityId: organization._id.toString(),
      ipAddress: data.ipAddress,
    });

    return {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        orgId: organization._id,
      },
      organization,
      accessToken,
      refreshToken: `${user._id.toString()}.${rawRefreshToken}`,
    };
  }

  static async registerUser(data: {
    name: string;
    email: string;
    password: string;
    role?: 'CANDIDATE' | 'ORG_ADMIN' | 'RECRUITER';
    phone?: string;
    organizationName?: string;
    ipAddress?: string;
  }) {
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanPassword = data.password.trim();
    const role = data.role || 'CANDIDATE';

    // Check if user already exists
    const existing = await User.findOne({ email: cleanEmail, isDeleted: false });
    if (existing) {
      const err: any = new Error('An account with this email already exists. Please switch to Sign In.');
      err.statusCode = 409;
      err.code = 'CONFLICT';
      throw err;
    }

    if ((role === 'ORG_ADMIN' || role === 'RECRUITER') && data.organizationName) {
      return this.registerOrgAndAdmin({
        organizationName: data.organizationName,
        industry: 'Technology',
        adminName: data.name,
        email: cleanEmail,
        password: cleanPassword,
        ipAddress: data.ipAddress,
      });
    }

    // Assign to active organization
    let organization = await Organization.findOne().sort({ createdAt: 1 });
    if (!organization) {
      organization = await Organization.create({
        name: 'TechScale Innovations India',
        slug: 'techscale-innovations',
        industry: 'Software & SaaS',
        departments: [
          { name: 'Engineering' },
          { name: 'Human Resources' },
          { name: 'Product' },
          { name: 'Sales & Marketing' },
          { name: 'Finance' },
        ],
      });
    }

    const passwordHash = await bcrypt.hash(cleanPassword, 12);

    const user = await User.create({
      orgId: organization._id,
      name: data.name.trim(),
      email: cleanEmail,
      passwordHash,
      role,
      status: 'ACTIVE',
    });

    // If candidate, ensure candidate record exists
    if (role === 'CANDIDATE') {
      let candidate = await Candidate.findOne({ email: cleanEmail, isDeleted: false });
      if (!candidate) {
        await Candidate.create({
          orgId: organization._id,
          fullName: data.name.trim(),
          email: cleanEmail,
          phone: data.phone?.trim() || '',
          skills: [],
          source: 'PUBLIC_APPLICATION',
          isDeleted: false,
        });
      }
    }

    const payload = {
      userId: user._id.toString(),
      orgId: organization._id.toString(),
      role: user.role,
    };

    const accessToken = signAccessToken(payload);
    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const refreshHash = await bcrypt.hash(rawRefreshToken, 10);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    user.refreshTokens.push({
      tokenHash: refreshHash,
      createdAt: new Date(),
      expiresAt,
    });
    await user.save();

    await logAudit({
      orgId: organization._id.toString(),
      userId: user._id.toString(),
      userName: user.name,
      action: 'USER_REGISTERED',
      entityType: 'User',
      entityId: user._id.toString(),
      ipAddress: data.ipAddress,
    });

    return {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        orgId: organization._id,
      },
      organization,
      accessToken,
      refreshToken: `${user._id.toString()}.${rawRefreshToken}`,
    };
  }

  static async login(email: string, password: string, ipAddress?: string) {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    const user = await User.findOne({ email: cleanEmail, isDeleted: false });
    if (!user) {
      const err: any = new Error('Invalid email or password');
      err.statusCode = 401;
      err.code = 'UNAUTHORIZED';
      throw err;
    }

    // Check account lockout
    if (user.lockUntil && user.lockUntil > new Date()) {
      const remainingMin = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
      const err: any = new Error(`Account locked due to failed attempts. Try again in ${remainingMin} minutes.`);
      err.statusCode = 429;
      err.code = 'RATE_LIMIT_EXCEEDED';
      throw err;
    }

    // Strict, cryptographic password comparison (no backdoor bypasses)
    const isMatch = await bcrypt.compare(cleanPassword, user.passwordHash);

    if (!isMatch) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min lock
        user.failedLoginAttempts = 0;
      }
      await user.save();

      const err: any = new Error('Invalid email or password');
      err.statusCode = 401;
      err.code = 'UNAUTHORIZED';
      throw err;
    }

    // Reset failed attempts on success
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;

    const payload = {
      userId: user._id.toString(),
      orgId: user.orgId.toString(),
      role: user.role,
    };

    const accessToken = signAccessToken(payload);
    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const refreshHash = await bcrypt.hash(rawRefreshToken, 10);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Keep up to 5 active sessions
    user.refreshTokens = user.refreshTokens.filter((t) => t.expiresAt > new Date()).slice(-4);
    user.refreshTokens.push({
      tokenHash: refreshHash,
      createdAt: new Date(),
      expiresAt,
    });
    await user.save();

    const organization = await Organization.findById(user.orgId);

    await logAudit({
      orgId: user.orgId.toString(),
      userId: user._id.toString(),
      userName: user.name,
      action: 'USER_LOGIN',
      entityType: 'User',
      entityId: user._id.toString(),
      ipAddress,
    });

    return {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        orgId: user.orgId,
      },
      organization,
      accessToken,
      refreshToken: `${user._id.toString()}.${rawRefreshToken}`,
    };
  }

  static async refresh(compoundRefreshToken: string) {
    if (!compoundRefreshToken || !compoundRefreshToken.includes('.')) {
      const err: any = new Error('Invalid refresh token');
      err.statusCode = 401;
      err.code = 'REFRESH_TOKEN_INVALID';
      throw err;
    }

    const [userId, rawToken] = compoundRefreshToken.split('.');
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      const err: any = new Error('Invalid refresh token payload');
      err.statusCode = 401;
      err.code = 'REFRESH_TOKEN_INVALID';
      throw err;
    }

    const user = await User.findById(userId);
    if (!user || user.isDeleted || user.status === 'DISABLED') {
      const err: any = new Error('User not found or disabled');
      err.statusCode = 401;
      err.code = 'UNAUTHORIZED';
      throw err;
    }

    // Check if matching refresh token exists
    let matchedIndex = -1;
    for (let i = 0; i < user.refreshTokens.length; i++) {
      const stored = user.refreshTokens[i];
      if (stored.expiresAt > new Date()) {
        const isMatch = await bcrypt.compare(rawToken, stored.tokenHash);
        if (isMatch) {
          matchedIndex = i;
          break;
        }
      }
    }

    if (matchedIndex === -1) {
      // Possible reuse attack! Invalidate all refresh tokens for this user
      user.refreshTokens = [];
      await user.save();
      const err: any = new Error('Token reuse detected. All sessions revoked.');
      err.statusCode = 401;
      err.code = 'REFRESH_TOKEN_INVALID';
      throw err;
    }

    // Token rotation: remove used token and issue a fresh one
    user.refreshTokens.splice(matchedIndex, 1);

    const newRawToken = crypto.randomBytes(40).toString('hex');
    const newHash = await bcrypt.hash(newRawToken, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    user.refreshTokens.push({
      tokenHash: newHash,
      createdAt: new Date(),
      expiresAt,
    });
    await user.save();

    const payload = {
      userId: user._id.toString(),
      orgId: user.orgId.toString(),
      role: user.role,
    };

    const newAccessToken = signAccessToken(payload);
    return {
      accessToken: newAccessToken,
      refreshToken: `${user._id.toString()}.${newRawToken}`,
    };
  }

  static async logout(compoundRefreshToken?: string) {
    if (!compoundRefreshToken || !compoundRefreshToken.includes('.')) return;
    const [userId, rawToken] = compoundRefreshToken.split('.');
    if (!mongoose.Types.ObjectId.isValid(userId)) return;

    const user = await User.findById(userId);
    if (!user) return;

    for (let i = 0; i < user.refreshTokens.length; i++) {
      const isMatch = await bcrypt.compare(rawToken, user.refreshTokens[i].tokenHash);
      if (isMatch) {
        user.refreshTokens.splice(i, 1);
        await user.save();
        break;
      }
    }
  }

  static async sendOtp(email: string, ipAddress?: string) {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      const err: any = new Error('Please enter a valid email address.');
      err.statusCode = 400;
      err.code = 'INVALID_EMAIL';
      throw err;
    }

    // Rate-limiting: Prevent spamming OTP within 30 seconds
    const recentOtp = await Otp.findOne({
      email: cleanEmail,
      createdAt: { $gte: new Date(Date.now() - 30 * 1000) },
    });

    if (recentOtp) {
      const err: any = new Error('Please wait 30 seconds before requesting another verification code.');
      err.statusCode = 429;
      err.code = 'RATE_LIMIT_EXCEEDED';
      throw err;
    }

    // Generate secure 6-digit numeric OTP
    const rawOtp = crypto.randomInt(100000, 999999).toString();
    const otpHash = await bcrypt.hash(rawOtp, 10);

    // Delete any old OTPs for this email and save new
    await Otp.deleteMany({ email: cleanEmail });

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await Otp.create({
      email: cleanEmail,
      otpHash,
      attempts: 0,
      expiresAt,
    });

    // Check if user already exists
    const existingUser = await User.findOne({ email: cleanEmail, isDeleted: false });

    // Send email with OTP
    const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"/></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f6f8fa; margin: 0; padding: 24px;">
      <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 20px; padding: 32px; border: 1px solid #edf2f7; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; background: #84b81b; color: #ffffff; width: 44px; height: 44px; line-height: 44px; border-radius: 12px; font-size: 22px; font-weight: 900;">H</div>
          <h2 style="color: #0e1017; margin: 12px 0 4px 0; font-size: 20px; font-weight: 800;">HireFlow <span style="color: #84b81b;">AI</span></h2>
          <p style="color: #5e6b7c; font-size: 13px; margin: 0;">Email Verification & Instant Login</p>
        </div>
        <p style="color: #2d3748; font-size: 14px; line-height: 22px;">Hello,</p>
        <p style="color: #2d3748; font-size: 14px; line-height: 22px;">Use the 6-digit verification code below to sign in or create your account on HireFlow AI:</p>
        <div style="background: #f8fafc; border: 2px dashed #84b81b; border-radius: 14px; padding: 20px; text-align: center; margin: 24px 0;">
          <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0e1017; font-family: monospace;">${rawOtp}</span>
        </div>
        <p style="color: #718096; font-size: 12px; line-height: 18px; margin: 0 0 16px 0;">
          ⏱️ This code expires in <strong>10 minutes</strong>. Never share this code with anyone.
        </p>
        <div style="border-top: 1px solid #edf2f7; padding-top: 16px; text-align: center;">
          <p style="color: #a0aec0; font-size: 11px; margin: 0;">If you did not request this code, you can safely ignore this email.</p>
        </div>
      </div>
    </body>
    </html>
    `;

    const sendRes = await sendEmail({
      to: cleanEmail,
      subject: `Your HireFlow AI Login Code: ${rawOtp}`,
      text: `Your HireFlow AI verification code is: ${rawOtp}. Valid for 10 minutes.`,
      html: emailHtml,
      otp: rawOtp,
    });

    console.log(`[OTP GENERATED] For ${cleanEmail}: ${rawOtp} (Sent via: ${sendRes.provider})`);

    return {
      sent: sendRes.sent,
      provider: sendRes.provider,
      userExists: !!existingUser,
      email: cleanEmail,
      expiresInSeconds: 600,
      emailjs: {
        publicKey: env.EMAILJS_PUBLIC_KEY,
        serviceId: env.EMAILJS_SERVICE_ID,
        templateId: env.EMAILJS_TEMPLATE_ID,
      },
      devPreviewOtp: env.NODE_ENV !== 'production' || sendRes.provider === 'simulated' ? rawOtp : undefined,
    };
  }

  static async verifyOtpAndLogin(data: {
    email: string;
    otp: string;
    role?: 'CANDIDATE' | 'RECRUITER';
    name?: string;
    ipAddress?: string;
  }) {
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanOtp = data.otp.trim();

    if (!cleanEmail || !cleanOtp) {
      const err: any = new Error('Email and verification code are required.');
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    const otpRecord = await Otp.findOne({ email: cleanEmail });
    if (!otpRecord) {
      const err: any = new Error('Verification code expired or not found. Please request a new OTP.');
      err.statusCode = 400;
      err.code = 'INVALID_OTP';
      throw err;
    }

    if (otpRecord.expiresAt < new Date()) {
      await Otp.deleteOne({ _id: otpRecord._id });
      const err: any = new Error('Verification code has expired. Please request a new OTP.');
      err.statusCode = 400;
      err.code = 'OTP_EXPIRED';
      throw err;
    }

    if (otpRecord.attempts >= 5) {
      await Otp.deleteOne({ _id: otpRecord._id });
      const err: any = new Error('Too many invalid attempts. Please request a new OTP.');
      err.statusCode = 429;
      err.code = 'TOO_MANY_ATTEMPTS';
      throw err;
    }

    const isMatch = await bcrypt.compare(cleanOtp, otpRecord.otpHash);
    if (!isMatch) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      const err: any = new Error('Invalid verification code. Please check and try again.');
      err.statusCode = 400;
      err.code = 'INVALID_OTP';
      throw err;
    }

    // OTP is valid! Delete it
    await Otp.deleteOne({ _id: otpRecord._id });

    // Look for existing user
    let user = await User.findOne({ email: cleanEmail, isDeleted: false });
    let organization = null;

    if (!user) {
      // Auto-register new user
      organization = await Organization.findOne().sort({ createdAt: 1 });
      if (!organization) {
        organization = await Organization.create({
          name: 'TechScale Innovations India',
          slug: 'techscale-innovations',
          industry: 'Software & SaaS',
          departments: [
            { name: 'Engineering' },
            { name: 'Human Resources' },
            { name: 'Product' },
            { name: 'Sales & Marketing' },
            { name: 'Finance' },
          ],
        });
      }

      const role = data.role || 'CANDIDATE';
      const derivedName =
        data.name?.trim() ||
        cleanEmail
          .split('@')[0]
          .replace(/[._]/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());

      const randomPass = crypto.randomBytes(32).toString('hex');
      const passwordHash = await bcrypt.hash(randomPass, 12);

      user = await User.create({
        orgId: organization._id,
        name: derivedName,
        email: cleanEmail,
        passwordHash,
        role,
        status: 'ACTIVE',
      });

      if (role === 'CANDIDATE') {
        let candidate = await Candidate.findOne({ email: cleanEmail, isDeleted: false });
        if (!candidate) {
          await Candidate.create({
            orgId: organization._id,
            fullName: derivedName,
            email: cleanEmail,
            skills: [],
            source: 'PUBLIC_APPLICATION',
            isDeleted: false,
          });
        }
      }

      await logAudit({
        orgId: organization._id.toString(),
        userId: user._id.toString(),
        userName: user.name,
        action: 'USER_REGISTERED_OTP',
        entityType: 'User',
        entityId: user._id.toString(),
        ipAddress: data.ipAddress,
      });
    } else {
      organization = await Organization.findById(user.orgId);
      await logAudit({
        orgId: user.orgId.toString(),
        userId: user._id.toString(),
        userName: user.name,
        action: 'USER_LOGIN_OTP',
        entityType: 'User',
        entityId: user._id.toString(),
        ipAddress: data.ipAddress,
      });
    }

    const payload = {
      userId: user._id.toString(),
      orgId: user.orgId.toString(),
      role: user.role,
    };

    const accessToken = signAccessToken(payload);
    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const refreshHash = await bcrypt.hash(rawRefreshToken, 10);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    user.refreshTokens = user.refreshTokens.filter((t) => t.expiresAt > new Date()).slice(-4);
    user.refreshTokens.push({
      tokenHash: refreshHash,
      createdAt: new Date(),
      expiresAt,
    });
    await user.save();

    return {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        orgId: user.orgId,
      },
      organization,
      accessToken,
      refreshToken: `${user._id.toString()}.${rawRefreshToken}`,
    };
  }

  static async loginWithGoogle(data: {
    credential?: string;
    email?: string;
    name?: string;
    avatar?: string;
    ipAddress?: string;
  }) {
    let email = data.email?.trim().toLowerCase();
    let name = data.name?.trim();

    if (data.credential) {
      try {
        const parts = data.credential.split('.');
        if (parts.length === 3) {
          const payloadJson = Buffer.from(parts[1], 'base64').toString('utf8');
          const googlePayload = JSON.parse(payloadJson);
          if (googlePayload.email) {
            email = googlePayload.email.toLowerCase().trim();
            name = googlePayload.name || name;
          }
        }
      } catch (e: any) {
        console.warn('[Google Token Decode Warning]', e.message);
      }
    }

    if (!email || !email.includes('@')) {
      const err: any = new Error('Could not identify a valid email from Google account.');
      err.statusCode = 400;
      err.code = 'INVALID_GOOGLE_ACCOUNT';
      throw err;
    }

    let user = await User.findOne({ email, isDeleted: false });
    let organization = null;

    if (!user) {
      organization = await Organization.findOne().sort({ createdAt: 1 });
      if (!organization) {
        organization = await Organization.create({
          name: 'TechScale Innovations India',
          slug: 'techscale-innovations',
          industry: 'Software & SaaS',
          departments: [
            { name: 'Engineering' },
            { name: 'Human Resources' },
            { name: 'Product' },
          ],
        });
      }

      const displayName =
        name ||
        email
          .split('@')[0]
          .replace(/[._]/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());

      const randomPass = crypto.randomBytes(32).toString('hex');
      const passwordHash = await bcrypt.hash(randomPass, 12);

      user = await User.create({
        orgId: organization._id,
        name: displayName,
        email,
        passwordHash,
        role: 'CANDIDATE',
        status: 'ACTIVE',
      });

      let candidate = await Candidate.findOne({ email, isDeleted: false });
      if (!candidate) {
        await Candidate.create({
          orgId: organization._id,
          fullName: displayName,
          email,
          skills: [],
          source: 'PUBLIC_APPLICATION',
          isDeleted: false,
        });
      }

      await logAudit({
        orgId: organization._id.toString(),
        userId: user._id.toString(),
        userName: user.name,
        action: 'USER_REGISTERED_GOOGLE',
        entityType: 'User',
        entityId: user._id.toString(),
        ipAddress: data.ipAddress,
      });
    } else {
      organization = await Organization.findById(user.orgId);
      await logAudit({
        orgId: user.orgId.toString(),
        userId: user._id.toString(),
        userName: user.name,
        action: 'USER_LOGIN_GOOGLE',
        entityType: 'User',
        entityId: user._id.toString(),
        ipAddress: data.ipAddress,
      });
    }

    const payload = {
      userId: user._id.toString(),
      orgId: user.orgId.toString(),
      role: user.role,
    };

    const accessToken = signAccessToken(payload);
    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const refreshHash = await bcrypt.hash(rawRefreshToken, 10);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    user.refreshTokens = user.refreshTokens.filter((t) => t.expiresAt > new Date()).slice(-4);
    user.refreshTokens.push({
      tokenHash: refreshHash,
      createdAt: new Date(),
      expiresAt,
    });
    await user.save();

    return {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        orgId: user.orgId,
      },
      organization,
      accessToken,
      refreshToken: `${user._id.toString()}.${rawRefreshToken}`,
    };
  }
}

