import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { CandidateService } from './candidate.service.js';
import { Candidate } from './candidate.model.js';
import { Application } from './application.model.js';
import { Job } from '../jobs/job.model.js';
import { Organization } from '../organizations/organization.model.js';
import { User } from '../users/user.model.js';
import { Interview } from '../interviews/interview.model.js';
import { Offer } from '../offers/offer.model.js';
import { NotFoundError } from '../../utils/ownershipCheck.js';
import { signAccessToken } from '../../utils/jwt.js';
import { sendEmail } from '../../services/email.service.js';

export class CandidateController {
  static async createCandidate(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await CandidateService.createCandidateWithApplication(
        req.user!.orgId,
        req.body,
        {
          id: req.user!._id,
          name: req.user!.name,
          ip: req.ip,
        }
      );
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async publicApply(req: Request, res: Response, next: NextFunction) {
    try {
      let job: any;
      let org: any;

      if (req.body.jobId) {
        job = await Job.findById(req.body.jobId);
        if (!job || job.status !== 'Open' || job.isDeleted) {
          throw new NotFoundError('Job opening not found or no longer active');
        }
        org = await Organization.findById(job.orgId);
      } else {
        const orgSlug = String(req.params.orgSlug || '').toLowerCase();
        const jobSlug = String(req.params.jobSlug || '').toLowerCase();
        org = await Organization.findOne({ slug: orgSlug });
        if (!org) throw new NotFoundError('Organization not found');

        job = await Job.findOne({
          orgId: org._id,
          slug: jobSlug,
          status: 'Open',
          isDeleted: false,
        });
        if (!job) throw new NotFoundError('Job not found or closed');
      }

      if (!org) throw new NotFoundError('Company organization not found');

      // Create candidate & application
      const result = await CandidateService.createCandidateWithApplication(
        org._id.toString(),
        {
          ...req.body,
          jobId: job._id.toString(),
          source: 'PUBLIC_APPLICATION',
        }
      );

      // Handle candidate user account if password provided
      let accessToken: string | null = null;
      let userObj: any = null;

      const cleanEmail = req.body.email.trim().toLowerCase();
      if (req.body.password) {
        let existingUser = await User.findOne({ email: cleanEmail, isDeleted: false });
        if (!existingUser) {
          const passwordHash = await bcrypt.hash(req.body.password, 12);
          existingUser = await User.create({
            orgId: org._id,
            name: req.body.fullName,
            email: cleanEmail,
            passwordHash,
            role: 'CANDIDATE',
            status: 'ACTIVE',
          });
        }

        userObj = {
          _id: existingUser._id,
          name: existingUser.name,
          email: existingUser.email,
          role: existingUser.role,
          orgId: existingUser.orgId,
        };

        accessToken = signAccessToken({
          userId: existingUser._id.toString(),
          orgId: org._id.toString(),
          role: existingUser.role,
        });
      }

      // Send confirmation email
      try {
        await sendEmail({
          to: cleanEmail,
          subject: `Application Confirmed: ${job.title} at ${org.name}`,
          text: `Hi ${req.body.fullName}, we have received your application for ${job.title}. You can track your interview rounds and progress anytime on HireFlow AI.`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #edf2f7; border-radius: 16px; background: #ffffff;">
              <div style="background: #0e1017; padding: 20px; border-radius: 12px; color: #ffffff; margin-bottom: 20px;">
                <div style="background: #84b81b; color: #fff; width: 32px; height: 32px; border-radius: 8px; font-weight: bold; line-height: 32px; text-align: center; margin-bottom: 8px;">H</div>
                <h2 style="margin: 0; font-size: 18px;">Application Confirmed!</h2>
                <p style="margin: 4px 0 0 0; font-size: 12px; color: #a0aec0;">${org.name} Recruitment Team</p>
              </div>
              <p style="font-size: 14px; color: #2d3748;">Hello <strong>${req.body.fullName}</strong>,</p>
              <p style="font-size: 14px; color: #4a5568; line-height: 1.6;">
                Thank you for applying for the position of <strong>${job.title}</strong> at <strong>${org.name}</strong>. Your profile has been submitted to our talent team and our AI candidate review is underway.
              </p>
              <div style="background: #f8fafc; border: 1px solid #edf2f7; border-radius: 12px; padding: 16px; margin: 20px 0; font-size: 13px;">
                <div style="margin-bottom: 8px;"><strong>Position:</strong> ${job.title} (${job.department})</div>
                <div style="margin-bottom: 8px;"><strong>Location:</strong> ${job.location || 'India'}</div>
                <div><strong>Current Status:</strong> <span style="background: #edf7d2; color: #567715; padding: 2px 8px; border-radius: 6px; font-weight: bold;">Application Received</span></div>
              </div>
              <p style="font-size: 13px; color: #718096;">
                You will be notified via email whenever an interview round is scheduled or feedback is updated.
              </p>
              <div style="margin-top: 24px; font-size: 12px; color: #a0aec0; border-top: 1px solid #edf2f7; padding-top: 12px;">
                Best regards,<br/>
                ${org.name} via HireFlow AI
              </div>
            </div>
          `,
        });
      } catch (mailErr) {
        console.error('[PublicApply] Confirmation email error:', mailErr);
      }

      res.status(201).json({
        success: true,
        data: {
          message: 'Application submitted successfully',
          candidate: result.candidate,
          application: result.application,
          accessToken,
          user: userObj,
          organization: org,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async listApplications(req: Request, res: Response, next: NextFunction) {
    try {
      const applications = await CandidateService.listApplications(req.user!.orgId, {
        jobId: req.query.jobId as string,
        stage: req.query.stage as string,
        minScore: req.query.minScore ? Number(req.query.minScore) : undefined,
        search: req.query.search as string,
      });
      res.json({ success: true, data: applications });
    } catch (error) {
      next(error);
    }
  }

  static async getApplicationById(req: Request, res: Response, next: NextFunction) {
    try {
      const applicationId = String(req.params.id);
      const application = await CandidateService.getApplicationById(
        req.user!.orgId,
        applicationId
      );
      res.json({ success: true, data: application });
    } catch (error) {
      next(error);
    }
  }

  static async updateStage(req: Request, res: Response, next: NextFunction) {
    try {
      const applicationId = String(req.params.id);
      const application = await CandidateService.updateStage(
        req.user!.orgId,
        applicationId,
        req.body.stage,
        {
          id: req.user!._id,
          name: req.user!.name,
          ip: req.ip,
        },
        req.body.note
      );
      res.json({ success: true, data: application });
    } catch (error) {
      next(error);
    }
  }

  static async overrideScore(req: Request, res: Response, next: NextFunction) {
    try {
      const applicationId = String(req.params.id);
      const application = await CandidateService.overrideScore(
        req.user!.orgId,
        applicationId,
        req.body.overrideScore,
        req.body.reason,
        {
          id: req.user!._id,
          name: req.user!.name,
          ip: req.ip,
        }
      );
      res.json({ success: true, data: application });
    } catch (error) {
      next(error);
    }
  }

  static async addNote(req: Request, res: Response, next: NextFunction) {
    try {
      const applicationId = String(req.params.id);
      const notes = await CandidateService.addNote(
        req.user!.orgId,
        applicationId,
        req.body.text,
        req.body.isPrivate ?? false,
        {
          id: req.user!._id,
          name: req.user!.name,
        }
      );
      res.status(201).json({ success: true, data: notes });
    } catch (error) {
      next(error);
    }
  }

  static async compareCandidates(req: Request, res: Response, next: NextFunction) {
    try {
      const ids = (req.query.ids as string || '').split(',').filter(Boolean);
      const comparison = await CandidateService.compareCandidates(req.user!.orgId, ids);
      res.json({ success: true, data: comparison });
    } catch (error) {
      next(error);
    }
  }

  static async getCandidatePortalData(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      let candidate = await Candidate.findOne({ email: user.email.toLowerCase(), isDeleted: false });

      if (!candidate) {
        candidate = await Candidate.create({
          orgId: user.orgId,
          fullName: user.name,
          email: user.email.toLowerCase(),
          skills: [],
          totalExperienceYears: 0,
        });
      }

      // 1. Applications with jobs
      const applications = await Application.find({
        candidateId: candidate._id,
        isDeleted: false,
      })
        .populate('jobId', 'title department location employmentType salaryMin salaryMax status slug')
        .sort({ createdAt: -1 });

      // 2. Scheduled Interviews
      const interviews = await Interview.find({
        candidateId: candidate._id,
        isDeleted: false,
      })
        .populate('jobId', 'title department')
        .populate('interviewerIds', 'name email')
        .sort({ scheduledAt: -1 });

      // 3. Offers extended to this candidate
      const offers = await Offer.find({
        candidateId: candidate._id,
      })
        .populate('jobId', 'title department')
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        data: {
          candidate,
          applications,
          interviews,
          offers,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateCandidateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const candidate = await Candidate.findOneAndUpdate(
        { email: user.email.toLowerCase(), isDeleted: false },
        { $set: req.body },
        { new: true }
      );
      if (!candidate) throw new NotFoundError('Candidate profile not found');
      res.json({ success: true, data: candidate });
    } catch (error) {
      next(error);
    }
  }

  static async respondToOffer(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const offerId = req.params.id;
      const { decision, reason } = req.body;

      const candidate = await Candidate.findOne({ email: user.email.toLowerCase(), isDeleted: false });
      if (!candidate) throw new NotFoundError('Candidate not found');

      const offer = await Offer.findOne({ _id: offerId, candidateId: candidate._id });
      if (!offer) throw new NotFoundError('Offer letter not found');

      offer.status = decision === 'ACCEPTED' ? 'Accepted' : 'Rejected';
      await offer.save();

      await Application.findByIdAndUpdate(offer.applicationId, {
        stage: decision === 'ACCEPTED' ? 'Offer Accepted' : 'Offer Declined',
      });

      res.json({ success: true, data: offer });
    } catch (error) {
      next(error);
    }
  }
}
