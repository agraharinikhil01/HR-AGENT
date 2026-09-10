import { Request, Response, NextFunction } from 'express';
import { JobService } from './job.service.js';

export class JobController {
  static async createJob(req: Request, res: Response, next: NextFunction) {
    try {
      const job = await JobService.createJob(req.user!.orgId, req.user!._id, req.body, {
        id: req.user!._id,
        name: req.user!.name,
        ip: req.ip,
      });
      res.status(201).json({ success: true, data: job });
    } catch (error) {
      next(error);
    }
  }

  static async listJobs(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await JobService.listJobs(req.user!.orgId, {
        status: req.query.status as string,
        department: req.query.department as string,
        search: req.query.search as string,
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      });
      res.json({
        success: true,
        data: result.jobs,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getJobById(req: Request, res: Response, next: NextFunction) {
    try {
      const jobId = String(req.params.id);
      const job = await JobService.getJobById(req.user!.orgId, jobId);
      res.json({ success: true, data: job });
    } catch (error) {
      next(error);
    }
  }

  static async updateJob(req: Request, res: Response, next: NextFunction) {
    try {
      const jobId = String(req.params.id);
      const job = await JobService.updateJob(req.user!.orgId, jobId, req.body, {
        id: req.user!._id,
        name: req.user!.name,
        ip: req.ip,
      });
      res.json({ success: true, data: job });
    } catch (error) {
      next(error);
    }
  }

  static async deleteJob(req: Request, res: Response, next: NextFunction) {
    try {
      const jobId = String(req.params.id);
      const result = await JobService.deleteJob(req.user!.orgId, jobId, {
        id: req.user!._id,
        name: req.user!.name,
        ip: req.ip,
      });
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getPublicJob(req: Request, res: Response, next: NextFunction) {
    try {
      const orgSlug = String(req.params.orgSlug);
      const jobSlug = String(req.params.jobSlug);
      const result = await JobService.getPublicJob(orgSlug, jobSlug);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async generateAiJd(req: Request, res: Response, next: NextFunction) {
    try {
      const draft = JobService.generateAiJobDescriptionDraft(req.body);
      res.json({ success: true, data: draft });
    } catch (error) {
      next(error);
    }
  }
}
