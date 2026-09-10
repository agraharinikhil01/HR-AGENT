import { Request, Response, NextFunction } from 'express';
import { CandidateService } from './candidate.service.js';
import { Job } from '../jobs/job.model.js';
import { Organization } from '../organizations/organization.model.js';
import { NotFoundError } from '../../utils/ownershipCheck.js';

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
      const orgSlug = String(req.params.orgSlug);
      const jobSlug = String(req.params.jobSlug);
      const org = await Organization.findOne({ slug: orgSlug.toLowerCase() });
      if (!org) throw new NotFoundError('Organization not found');

      const job = await Job.findOne({
        orgId: org._id,
        slug: jobSlug.toLowerCase(),
        status: 'Open',
        isDeleted: false,
      });
      if (!job) throw new NotFoundError('Job not found or closed');

      const result = await CandidateService.createCandidateWithApplication(
        org._id.toString(),
        {
          ...req.body,
          jobId: job._id.toString(),
          source: 'PUBLIC_APPLICATION',
        }
      );

      res.status(201).json({
        success: true,
        data: {
          message: 'Application submitted successfully',
          candidateId: result.candidate._id,
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
}
