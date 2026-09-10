import { Request, Response, NextFunction } from 'express';
import { DashboardService } from './dashboard.service.js';

export class DashboardController {
  static async getMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const metrics = await DashboardService.getRecruitmentMetrics(req.user!.orgId);
      res.json({ success: true, data: metrics });
    } catch (error) {
      next(error);
    }
  }
}
