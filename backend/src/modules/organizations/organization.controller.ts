import { Request, Response, NextFunction } from 'express';
import { OrganizationService } from './organization.service.js';

export class OrganizationController {
  static async getDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const org = await OrganizationService.getDetails(req.user!.orgId);
      res.json({ success: true, data: org });
    } catch (error) {
      next(error);
    }
  }

  static async updateDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const org = await OrganizationService.updateDetails(req.user!.orgId, req.body, {
        id: req.user!._id,
        name: req.user!.name,
        ip: req.ip,
      });
      res.json({ success: true, data: org });
    } catch (error) {
      next(error);
    }
  }

  static async addDepartment(req: Request, res: Response, next: NextFunction) {
    try {
      const departments = await OrganizationService.addDepartment(
        req.user!.orgId,
        req.body.name,
        req.body.headId
      );
      res.json({ success: true, data: departments });
    } catch (error) {
      next(error);
    }
  }

  static async listMembers(req: Request, res: Response, next: NextFunction) {
    try {
      const members = await OrganizationService.listMembers(req.user!.orgId);
      res.json({ success: true, data: members });
    } catch (error) {
      next(error);
    }
  }

  static async inviteMember(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await OrganizationService.inviteMember(req.user!.orgId, req.body, {
        id: req.user!._id,
        name: req.user!.name,
        ip: req.ip,
      });
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async acceptInvite(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await OrganizationService.acceptInvite(req.body.token, req.body.password);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}
