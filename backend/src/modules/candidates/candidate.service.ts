import mongoose from 'mongoose';
import { Candidate, ICandidate } from './candidate.model.js';
import { Application, IApplication, PipelineStage } from './application.model.js';
import { Job } from '../jobs/job.model.js';
import { calculateCandidateFitScore } from '../../utils/fitScoreCalculator.js';
import { assertOwnership, NotFoundError } from '../../utils/ownershipCheck.js';
import { logAudit } from '../audit/audit.service.js';
import { emitToOrg } from '../../sockets/index.js';

export class CandidateService {
  static async createCandidateWithApplication(
    orgId: string,
    data: any,
    actor?: { id: string; name: string; ip?: string }
  ) {
    const job = await Job.findOne({
      _id: new mongoose.Types.ObjectId(data.jobId),
      orgId: new mongoose.Types.ObjectId(orgId),
      isDeleted: false,
    });

    if (!job) {
      throw new NotFoundError('Target job opening not found');
    }

    // 1. Check for duplicates in this organization
    const duplicateFlags: Array<{
      candidateId: mongoose.Types.ObjectId;
      reason: 'email' | 'phone' | 'name';
      flaggedAt: Date;
    }> = [];

    const existingByEmail = await Candidate.findOne({
      orgId: new mongoose.Types.ObjectId(orgId),
      email: data.email.toLowerCase(),
      isDeleted: false,
    });

    let candidate: ICandidate;

    if (existingByEmail) {
      candidate = existingByEmail;
      // Update candidate details if newer
      candidate.fullName = data.fullName || candidate.fullName;
      if (data.phone) candidate.phone = data.phone;
      if (data.skills && data.skills.length > 0) {
        candidate.skills = Array.from(new Set([...candidate.skills, ...data.skills]));
      }
      if (data.extractedSkills && data.extractedSkills.length > 0) {
        candidate.skills = Array.from(new Set([...candidate.skills, ...data.extractedSkills]));
      }
      if (data.currentCompany) candidate.currentCompany = data.currentCompany;
      if (data.totalExperienceYears !== undefined && data.totalExperienceYears > 0) {
        candidate.totalExperienceYears = data.totalExperienceYears;
      } else if ((!candidate.totalExperienceYears || candidate.totalExperienceYears === 0) && data.estimatedExperienceYears) {
        candidate.totalExperienceYears = data.estimatedExperienceYears;
      }
      if (data.noticePeriodDays !== undefined) candidate.noticePeriodDays = data.noticePeriodDays;
      if (data.resumeBase64) {
        candidate.resumeBase64 = data.resumeBase64;
        candidate.resumeOriginalName = data.resumeOriginalName || 'Resume.pdf';
        candidate.resumeMimeType = data.resumeMimeType || 'application/pdf';
        candidate.resumeSizeBytes = data.resumeSizeBytes;
        candidate.resumeUploadedAt = new Date();
      }
      if (data.parsedText) candidate.parsedText = data.parsedText;
      if (data.atsEvaluation) {
        candidate.atsScore = data.atsEvaluation.overallScore;
        candidate.atsGrade = data.atsEvaluation.grade;
        candidate.atsBreakdown = data.atsEvaluation.categoryScores;
        candidate.atsStrengths = data.atsEvaluation.strengths;
        candidate.atsImprovements = data.atsEvaluation.improvements;
      }
      await candidate.save();
    } else {
      // Check phone or name duplicates to flag
      if (data.phone) {
        const dupPhone = await Candidate.findOne({
          orgId: new mongoose.Types.ObjectId(orgId),
          phone: data.phone,
          isDeleted: false,
        });
        if (dupPhone) {
          duplicateFlags.push({
            candidateId: dupPhone._id as mongoose.Types.ObjectId,
            reason: 'phone',
            flaggedAt: new Date(),
          });
        }
      }

      const mergedSkills = Array.from(
        new Set([...(data.skills || []), ...(data.extractedSkills || [])])
      );

      candidate = await Candidate.create({
        ...data,
        skills: mergedSkills,
        totalExperienceYears:
          data.totalExperienceYears || data.estimatedExperienceYears || 0,
        resumeBase64: data.resumeBase64,
        resumeOriginalName: data.resumeOriginalName || (data.resumeBase64 ? 'Resume.pdf' : undefined),
        resumeMimeType: data.resumeMimeType || (data.resumeBase64 ? 'application/pdf' : undefined),
        resumeSizeBytes: data.resumeSizeBytes,
        resumeUploadedAt: data.resumeBase64 ? new Date() : undefined,
        parsedText: data.parsedText,
        atsScore: data.atsEvaluation?.overallScore || 0,
        atsGrade: data.atsEvaluation?.grade || 'A',
        atsBreakdown: data.atsEvaluation?.categoryScores || {
          skillsScore: 0,
          experienceScore: 0,
          contactScore: 0,
          formattingScore: 0,
        },
        atsStrengths: data.atsEvaluation?.strengths || [],
        atsImprovements: data.atsEvaluation?.improvements || [],
        orgId: new mongoose.Types.ObjectId(orgId),
        duplicateFlags,
      });
    }

    // 2. Check if application already exists for this job
    let application = await Application.findOne({
      orgId: new mongoose.Types.ObjectId(orgId),
      candidateId: candidate._id,
      jobId: job._id,
      isDeleted: false,
    });

    // 3. Compute Fit Score
    const fitResult = calculateCandidateFitScore({
      skills: candidate.skills || [],
      totalExperienceYears: candidate.totalExperienceYears || 0,
      noticePeriodDays: candidate.noticePeriodDays || 30,
      education: candidate.education || [],
      currentRole: candidate.currentDesignation,
      job: {
        title: job.title,
        department: job.department,
        minExperienceYears: job.minExperienceYears,
        maxExperienceYears: job.maxExperienceYears,
        preferredNoticePeriodDays: job.noticePeriodPreferenceDays,
        mandatorySkills: job.mandatorySkills || [],
        preferredSkills: job.preferredSkills || [],
        educationRequirements: job.educationRequirements || [],
      },
    });

    if (!application) {
      application = await Application.create({
        orgId: new mongoose.Types.ObjectId(orgId),
        candidateId: candidate._id,
        jobId: job._id,
        stage: 'Applied',
        stageHistory: [
          {
            stage: 'Applied',
            changedBy: actor ? new mongoose.Types.ObjectId(actor.id) : undefined,
            note: 'Initial application submitted',
            changedAt: new Date(),
          },
        ],
        fitScore: fitResult.overallScore,
        eligibilityStatus: fitResult.eligibilityStatus,
        categoryScores: fitResult.categoryScores,
        strengths: fitResult.strengths,
        concerns: fitResult.concerns,
        missingInformation: fitResult.missingInformation,
      });

      emitToOrg(orgId, 'candidate:applied', {
        jobId: job._id,
        candidateId: candidate._id,
        applicationId: application._id,
        name: candidate.fullName,
        fitScore: application.fitScore,
      });

      if (actor) {
        await logAudit({
          orgId,
          userId: actor.id,
          userName: actor.name,
          action: 'CANDIDATE_APPLICATION_CREATED',
          entityType: 'Application',
          entityId: application._id.toString(),
          ipAddress: actor.ip,
        });
      }
    } else {
      // Recompute fitScore with new skills / experience / resume
      application.fitScore = fitResult.overallScore;
      application.eligibilityStatus = fitResult.eligibilityStatus;
      application.categoryScores = fitResult.categoryScores;
      application.strengths = fitResult.strengths;
      application.concerns = fitResult.concerns;
      application.missingInformation = fitResult.missingInformation;
      await application.save();

      emitToOrg(orgId, 'candidate:updated', {
        jobId: job._id,
        candidateId: candidate._id,
        applicationId: application._id,
        name: candidate.fullName,
        fitScore: application.fitScore,
      });
    }

    return { candidate, application };
  }

  static async updateCandidateResume(
    candidateId: string,
    resumeData: {
      base64: string;
      originalName: string;
      mimeType: string;
      sizeBytes: number;
      parsedText?: string;
      extractedSkills?: string[];
      estimatedExperienceYears?: number;
      atsEvaluation?: any;
    }
  ) {
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) throw new NotFoundError('Candidate not found');

    candidate.resumeBase64 = resumeData.base64;
    candidate.resumeOriginalName = resumeData.originalName;
    candidate.resumeMimeType = resumeData.mimeType;
    candidate.resumeSizeBytes = resumeData.sizeBytes;
    candidate.resumeUploadedAt = new Date();
    if (resumeData.parsedText) {
      candidate.parsedText = resumeData.parsedText;
    }

    if (resumeData.extractedSkills && resumeData.extractedSkills.length > 0) {
      candidate.skills = Array.from(
        new Set([...(candidate.skills || []), ...resumeData.extractedSkills])
      );
    }

    if (resumeData.atsEvaluation) {
      candidate.atsScore = resumeData.atsEvaluation.overallScore;
      candidate.atsGrade = resumeData.atsEvaluation.grade;
      candidate.atsBreakdown = resumeData.atsEvaluation.categoryScores;
      candidate.atsStrengths = resumeData.atsEvaluation.strengths;
      candidate.atsImprovements = resumeData.atsEvaluation.improvements;
    }

    if (
      (!candidate.totalExperienceYears || candidate.totalExperienceYears === 0) &&
      resumeData.estimatedExperienceYears
    ) {
      candidate.totalExperienceYears = resumeData.estimatedExperienceYears;
    }

    await candidate.save();

    // Recalculate fit score for all active applications
    const applications = await Application.find({
      candidateId: candidate._id,
      isDeleted: false,
    }).populate('jobId');

    for (const app of applications) {
      const job: any = app.jobId;
      if (!job) continue;

      const fitResult = calculateCandidateFitScore({
        skills: candidate.skills || [],
        totalExperienceYears: candidate.totalExperienceYears || 0,
        noticePeriodDays: candidate.noticePeriodDays || 30,
        education: candidate.education || [],
        currentRole: candidate.currentDesignation,
        job: {
          title: job.title,
          department: job.department,
          minExperienceYears: job.minExperienceYears,
          maxExperienceYears: job.maxExperienceYears,
          preferredNoticePeriodDays: job.noticePeriodPreferenceDays,
          mandatorySkills: job.mandatorySkills || [],
          preferredSkills: job.preferredSkills || [],
          educationRequirements: job.educationRequirements || [],
        },
      });

      app.fitScore = fitResult.overallScore;
      app.eligibilityStatus = fitResult.eligibilityStatus;
      app.categoryScores = fitResult.categoryScores;
      app.strengths = fitResult.strengths;
      app.concerns = fitResult.concerns;
      app.missingInformation = fitResult.missingInformation;
      await app.save();

      emitToOrg(candidate.orgId.toString(), 'candidate:updated', {
        jobId: job._id,
        candidateId: candidate._id,
        applicationId: app._id,
        name: candidate.fullName,
        fitScore: app.fitScore,
      });
    }

    return candidate;
  }

  static async pickBestCandidate(
    orgId: string,
    applicationId: string,
    actor: { id: string; name: string; ip?: string }
  ) {
    const application = await Application.findOne({
      _id: new mongoose.Types.ObjectId(applicationId),
      orgId: new mongoose.Types.ObjectId(orgId),
      isDeleted: false,
    }).populate('candidateId', 'fullName email skills resumeBase64');

    if (!application) throw new NotFoundError('Application not found');

    application.stage = 'Shortlisted';
    application.stageHistory.push({
      stage: 'Shortlisted',
      changedBy: new mongoose.Types.ObjectId(actor.id),
      note: '⭐ Selected as Best Candidate Match by Recruiter (ATS Score Pick)',
      changedAt: new Date(),
    });

    await application.save();

    await logAudit({
      orgId,
      userId: actor.id,
      userName: actor.name,
      action: 'CANDIDATE_STAGE_CHANGED',
      entityType: 'Application',
      entityId: application._id.toString(),
      ipAddress: actor.ip,
      newValue: { stage: 'Shortlisted', reason: 'BEST_ATS_MATCH_PICK' },
    });

    emitToOrg(orgId, 'candidate:stage_changed', {
      applicationId: application._id,
      stage: 'Shortlisted',
      updatedBy: actor.name,
    });

    return application;
  }

  static async listApplications(
    orgId: string,
    filters: {
      jobId?: string;
      stage?: string;
      minScore?: number;
      search?: string;
    }
  ) {
    const query: Record<string, any> = {
      orgId: new mongoose.Types.ObjectId(orgId),
      isDeleted: false,
    };

    if (filters.jobId) {
      query.jobId = new mongoose.Types.ObjectId(filters.jobId);
    }

    if (filters.stage && filters.stage !== 'All') {
      query.stage = filters.stage;
    }

    if (filters.minScore !== undefined && !isNaN(filters.minScore)) {
      query.fitScore = { $gte: Number(filters.minScore) };
    }

    const applications = await Application.find(query)
      .populate('candidateId')
      .populate('jobId', 'title department slug')
      .sort({ fitScore: -1, createdAt: -1 });

    if (filters.search) {
      const s = filters.search.toLowerCase();
      return applications.filter((app: any) => {
        const c = app.candidateId;
        if (!c) return false;
        return (
          c.fullName?.toLowerCase().includes(s) ||
          c.email?.toLowerCase().includes(s) ||
          c.skills?.some((sk: string) => sk.toLowerCase().includes(s))
        );
      });
    }

    return applications;
  }

  static async getApplicationById(orgId: string, applicationId: string) {
    const application = await Application.findOne({
      _id: new mongoose.Types.ObjectId(applicationId),
      orgId: new mongoose.Types.ObjectId(orgId),
      isDeleted: false,
    })
      .populate('candidateId')
      .populate('jobId');

    if (!application) {
      throw new NotFoundError('Application not found');
    }

    return application;
  }

  static async updateStage(
    orgId: string,
    applicationId: string,
    newStage: PipelineStage,
    actor: { id: string; name: string; ip?: string },
    note?: string
  ) {
    const application = await Application.findOne({
      _id: new mongoose.Types.ObjectId(applicationId),
      orgId: new mongoose.Types.ObjectId(orgId),
      isDeleted: false,
    }).populate('candidateId', 'fullName email');

    if (!application) {
      throw new NotFoundError('Application not found');
    }

    const previousStage = application.stage;
    application.stage = newStage;
    application.stageHistory.push({
      stage: newStage,
      changedBy: new mongoose.Types.ObjectId(actor.id),
      note: note || `Stage updated from ${previousStage} to ${newStage}`,
      changedAt: new Date(),
    });

    await application.save();

    emitToOrg(orgId, 'candidate:stage_changed', {
      applicationId: application._id,
      candidateName: (application.candidateId as any)?.fullName,
      oldStage: previousStage,
      newStage,
    });

    await logAudit({
      orgId,
      userId: actor.id,
      userName: actor.name,
      action: 'PIPELINE_STAGE_UPDATED',
      entityType: 'Application',
      entityId: applicationId,
      previousValue: { stage: previousStage },
      newValue: { stage: newStage, note },
      ipAddress: actor.ip,
    });

    return application;
  }

  static async overrideScore(
    orgId: string,
    applicationId: string,
    overrideScore: number,
    reason: string,
    actor: { id: string; name: string; ip?: string }
  ) {
    const application = await Application.findOne({
      _id: new mongoose.Types.ObjectId(applicationId),
      orgId: new mongoose.Types.ObjectId(orgId),
      isDeleted: false,
    });

    if (!application) {
      throw new NotFoundError('Application not found');
    }

    const originalScore = application.humanOverride?.originalScore ?? application.fitScore;

    application.humanOverride = {
      isOverridden: true,
      originalScore,
      overrideScore,
      reason,
      overriddenBy: new mongoose.Types.ObjectId(actor.id),
      overriddenAt: new Date(),
    };

    application.fitScore = overrideScore;
    await application.save();

    await logAudit({
      orgId,
      userId: actor.id,
      userName: actor.name,
      action: 'CANDIDATE_SCORE_OVERRIDDEN',
      entityType: 'Application',
      entityId: applicationId,
      previousValue: { fitScore: originalScore },
      newValue: { fitScore: overrideScore, reason },
      ipAddress: actor.ip,
    });

    return application;
  }

  static async addNote(
    orgId: string,
    applicationId: string,
    text: string,
    isPrivate: boolean,
    actor: { id: string; name: string }
  ) {
    const application = await Application.findOne({
      _id: new mongoose.Types.ObjectId(applicationId),
      orgId: new mongoose.Types.ObjectId(orgId),
      isDeleted: false,
    });

    if (!application) {
      throw new NotFoundError('Application not found');
    }

    const note = {
      _id: new mongoose.Types.ObjectId(),
      authorId: new mongoose.Types.ObjectId(actor.id),
      authorName: actor.name,
      text,
      isPrivate,
      createdAt: new Date(),
    };

    application.notes.push(note as any);
    await application.save();

    return application.notes;
  }

  static async compareCandidates(orgId: string, applicationIds: string[]) {
    if (applicationIds.length > 5) {
      const err: any = new Error('You can compare up to 5 candidates at a time');
      err.statusCode = 400;
      err.code = 'INVALID_REQUEST';
      throw err;
    }

    const objectIds = applicationIds.map((id) => new mongoose.Types.ObjectId(id));
    return Application.find({
      _id: { $in: objectIds },
      orgId: new mongoose.Types.ObjectId(orgId),
      isDeleted: false,
    })
      .populate('candidateId')
      .populate('jobId', 'title department mandatorySkills preferredSkills');
  }
}
