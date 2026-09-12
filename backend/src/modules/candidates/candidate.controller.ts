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
import { parsePdfResume } from '../../utils/resumeParser.js';
import { calculateCandidateFitScore } from '../../utils/fitScoreCalculator.js';

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

      // Process uploaded PDF resume if present
      let resumeData: any = {};
      if (req.file) {
        const resumeBase64 = `data:${req.file.mimetype || 'application/pdf'};base64,${req.file.buffer.toString('base64')}`;
        const parsed = await parsePdfResume(req.file.buffer);
        resumeData = {
          resumeBase64,
          resumeOriginalName: req.file.originalname,
          resumeMimeType: req.file.mimetype || 'application/pdf',
          resumeSizeBytes: req.file.size,
          parsedText: parsed.text,
          extractedSkills: parsed.extractedSkills,
          estimatedExperienceYears: parsed.estimatedExperienceYears,
          atsEvaluation: parsed.atsEvaluation,
        };
      }

      // Create candidate & application
      const result = await CandidateService.createCandidateWithApplication(
        org._id.toString(),
        {
          ...req.body,
          ...resumeData,
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

      // Auto compute genuine ATS Score if resume is uploaded or skills present
      if (!candidate.atsScore || candidate.atsScore === 0) {
        const { evaluateResumeAts } = await import('../../utils/resumeParser.js');
        const evalResult = evaluateResumeAts({
          text: candidate.parsedText || (candidate.skills || []).join(' '),
          skills: candidate.skills || [],
          experienceYears: candidate.totalExperienceYears || 0,
          email: candidate.email,
          phone: candidate.phone,
        });

        candidate.atsScore = evalResult.overallScore;
        candidate.atsGrade = evalResult.grade;
        candidate.atsBreakdown = evalResult.categoryScores;
        candidate.atsStrengths = evalResult.strengths;
        candidate.atsImprovements = evalResult.improvements;
        await candidate.save();
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

  static async uploadCandidateResume(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, message: 'PDF file is required' });
        return;
      }

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

      const parsed = await parsePdfResume(req.file.buffer);
      const resumeBase64 = `data:${req.file.mimetype || 'application/pdf'};base64,${req.file.buffer.toString('base64')}`;

      const updatedCandidate = await CandidateService.updateCandidateResume(
        candidate._id.toString(),
        {
          base64: resumeBase64,
          originalName: req.file.originalname,
          mimeType: req.file.mimetype || 'application/pdf',
          sizeBytes: req.file.size,
          parsedText: parsed.text,
          extractedSkills: parsed.extractedSkills,
          estimatedExperienceYears: parsed.estimatedExperienceYears,
          atsEvaluation: parsed.atsEvaluation,
        }
      );

      res.json({
        success: true,
        data: {
          message: 'Resume uploaded and ATS profile updated successfully',
          candidate: updatedCandidate,
          extractedSkills: parsed.extractedSkills,
          estimatedExperienceYears: parsed.estimatedExperienceYears,
          atsEvaluation: parsed.atsEvaluation,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async downloadResume(req: Request, res: Response, next: NextFunction) {
    try {
      const candidateId = String(req.params.id);
      const candidate = await Candidate.findById(candidateId);
      if (!candidate || !candidate.resumeBase64) {
        res.status(404).json({ success: false, message: 'No PDF resume found for this candidate' });
        return;
      }

      // Format: data:<mime>;base64,<payload>
      const matches = candidate.resumeBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      let buffer: Buffer;
      let mimeType = candidate.resumeMimeType || 'application/pdf';

      if (matches && matches.length === 3) {
        mimeType = matches[1];
        buffer = Buffer.from(matches[2], 'base64');
      } else {
        buffer = Buffer.from(candidate.resumeBase64, 'base64');
      }

      const filename = candidate.resumeOriginalName || `${candidate.fullName.replace(/[^a-zA-Z0-9]/g, '_')}_Resume.pdf`;

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      res.setHeader('Content-Length', buffer.length);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }

  static async pickBestCandidate(req: Request, res: Response, next: NextFunction) {
    try {
      const applicationId = String(req.params.id);
      const application = await CandidateService.pickBestCandidate(
        req.user!.orgId,
        applicationId,
        {
          id: req.user!._id,
          name: req.user!.name,
          ip: req.ip,
        }
      );
      res.json({
        success: true,
        message: 'Candidate selected as top recommendation and shortlisted!',
        data: application,
      });
    } catch (error) {
      next(error);
    }
  }

  static async batchAtsScreen(req: Request, res: Response, next: NextFunction) {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ success: false, message: 'Please upload at least one PDF resume.' });
      }

      const jobId = req.body.jobId ? String(req.body.jobId) : undefined;
      let targetJob: any = null;
      if (jobId) {
        targetJob = await Job.findOne({ _id: jobId, orgId: req.user!.orgId, isDeleted: false });
      }

      const screenedResults: any[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const parsed = await parsePdfResume(file.buffer, file.originalname);
        const resumeBase64 = `data:${file.mimetype || 'application/pdf'};base64,${file.buffer.toString('base64')}`;

        let fitResult: any = null;
        if (targetJob) {
          fitResult = calculateCandidateFitScore({
            skills: parsed.extractedSkills,
            totalExperienceYears: parsed.estimatedExperienceYears,
            noticePeriodDays: 30,
            education: [],
            job: {
              title: targetJob.title,
              department: targetJob.department,
              minExperienceYears: targetJob.minExperienceYears || 0,
              preferredNoticePeriodDays: targetJob.preferredNoticePeriodDays || 60,
              mandatorySkills: targetJob.mandatorySkills || [],
              preferredSkills: targetJob.preferredSkills || [],
            },
          });
        }

        const atsScore = fitResult ? fitResult.overallScore : parsed.atsEvaluation.overallScore;
        const grade = parsed.atsEvaluation.grade;
        const category = atsScore >= 80 ? 'BEST' : atsScore >= 60 ? 'AVERAGE' : 'POOR';
        const categoryLabel =
          category === 'BEST'
            ? 'Top ATS Pick (Best Match)'
            : category === 'AVERAGE'
            ? 'Moderate Candidate Match'
            : 'Low ATS Score (Needs Optimization)';

        screenedResults.push({
          tempId: `batch_${Date.now()}_${i}`,
          fileName: file.originalname,
          fileSizeBytes: file.size,
          candidateName: parsed.extractedName || `Candidate ${i + 1}`,
          email: parsed.extractedEmail || `candidate${i + 1}@screened.talent`,
          phone: parsed.extractedPhone || '+91 98765 43210',
          totalExperienceYears: parsed.estimatedExperienceYears,
          skills: parsed.extractedSkills,
          skillsCount: parsed.extractedSkills.length,
          atsScore,
          grade,
          category,
          categoryLabel,
          breakdown: parsed.atsEvaluation.categoryScores,
          strengths: parsed.atsEvaluation.strengths,
          improvements: parsed.atsEvaluation.improvements,
          jobFit: fitResult
            ? {
                jobTitle: targetJob.title,
                matchedSkills: fitResult.matchedMandatorySkills || [],
                missingSkills: fitResult.missingMandatorySkills || [],
              }
            : undefined,
          resumeBase64,
          parsedText: parsed.text,
        });
      }

      // Sort descending: highest ATS score first
      screenedResults.sort((a, b) => b.atsScore - a.atsScore);

      // Assign ranks #1, #2, #3...
      screenedResults.forEach((item, idx) => {
        item.rank = idx + 1;
      });

      res.json({
        success: true,
        data: {
          totalScreened: screenedResults.length,
          bestCount: screenedResults.filter((r) => r.category === 'BEST').length,
          averageCount: screenedResults.filter((r) => r.category === 'AVERAGE').length,
          poorCount: screenedResults.filter((r) => r.category === 'POOR').length,
          job: targetJob ? { _id: targetJob._id, title: targetJob.title } : null,
          results: screenedResults,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async batchImportCandidates(req: Request, res: Response, next: NextFunction) {
    try {
      const { candidates, jobId, stage = 'Shortlisted' } = req.body;
      if (!Array.isArray(candidates) || candidates.length === 0) {
        return res.status(400).json({ success: false, message: 'No candidates provided for import.' });
      }

      const importedResults: any[] = [];

      for (const item of candidates) {
        try {
          const resItem = await CandidateService.createCandidateWithApplication(
            req.user!.orgId,
            {
              fullName: item.candidateName || item.fullName || 'Screened Candidate',
              email: item.email,
              phone: item.phone,
              skills: item.skills || [],
              totalExperienceYears: item.totalExperienceYears || 0,
              currentCompany: item.currentCompany || 'Screened via Batch ATS',
              currentDesignation: item.currentDesignation || 'Candidate',
              expectedSalary: item.expectedSalary || 1500000,
              noticePeriodDays: item.noticePeriodDays || 30,
              resumeBase64: item.resumeBase64,
              resumeOriginalName: item.fileName || item.resumeOriginalName,
              resumeSizeBytes: item.fileSizeBytes || item.resumeSizeBytes,
              atsEvaluation: {
                overallScore: item.atsScore,
                grade: item.grade || 'A',
                gradeLabel: item.categoryLabel || 'Screened',
                categoryScores: item.breakdown || {
                  skillsScore: item.atsScore,
                  experienceScore: item.atsScore,
                  contactScore: 90,
                  formattingScore: 90,
                },
                strengths: item.strengths || [],
                improvements: item.improvements || [],
              },
              jobId: jobId || item.jobId,
            },
            {
              id: req.user!._id,
              name: req.user!.name,
              ip: req.ip,
            }
          );

          // If target stage is specified and different from Applied, advance it
          if (stage && stage !== 'Applied' && resItem.application) {
            await CandidateService.updateStage(
              req.user!.orgId,
              resItem.application._id.toString(),
              stage,
              {
                id: req.user!._id,
                name: req.user!.name,
                ip: req.ip,
              }
            );
          }

          importedResults.push(resItem);
        } catch (candidateErr: any) {
          console.error(`Failed to import candidate ${item.candidateName}:`, candidateErr.message);
        }
      }

      res.status(201).json({
        success: true,
        message: `Successfully imported ${importedResults.length} candidates into your recruitment pipeline!`,
        data: importedResults,
      });
    } catch (error) {
      next(error);
    }
  }
}
