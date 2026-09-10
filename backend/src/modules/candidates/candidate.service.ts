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
      if (data.skills && data.skills.length > 0) candidate.skills = Array.from(new Set([...candidate.skills, ...data.skills]));
      if (data.currentCompany) candidate.currentCompany = data.currentCompany;
      if (data.totalExperienceYears !== undefined) candidate.totalExperienceYears = data.totalExperienceYears;
      if (data.noticePeriodDays !== undefined) candidate.noticePeriodDays = data.noticePeriodDays;
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

      candidate = await Candidate.create({
        ...data,
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
    }

    return { candidate, application };
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
