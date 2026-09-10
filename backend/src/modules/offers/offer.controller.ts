import { Request, Response, NextFunction } from 'express';
import { OfferService } from './offer.service.js';

export class OfferController {
  static async createOffer(req: Request, res: Response, next: NextFunction) {
    try {
      const offer = await OfferService.createOffer(req.user!.orgId, req.body, {
        id: req.user!._id,
        name: req.user!.name,
        ip: req.ip,
      });
      res.status(201).json({ success: true, data: offer });
    } catch (error) {
      next(error);
    }
  }

  static async listOffers(req: Request, res: Response, next: NextFunction) {
    try {
      const offers = await OfferService.listOffers(req.user!.orgId, req.query.status as string);
      res.json({ success: true, data: offers });
    } catch (error) {
      next(error);
    }
  }

  static async getOfferById(req: Request, res: Response, next: NextFunction) {
    try {
      const offerId = String(req.params.id);
      const offer = await OfferService.getOfferById(req.user!.orgId, offerId);
      res.json({ success: true, data: offer });
    } catch (error) {
      next(error);
    }
  }

  static async approveOffer(req: Request, res: Response, next: NextFunction) {
    try {
      const offerId = String(req.params.id);
      const offer = await OfferService.processApproval(
        req.user!.orgId,
        offerId,
        req.body,
        {
          id: req.user!._id,
          name: req.user!.name,
          role: req.user!.role,
          ip: req.ip,
        }
      );
      res.json({ success: true, data: offer });
    } catch (error) {
      next(error);
    }
  }

  static async sendOffer(req: Request, res: Response, next: NextFunction) {
    try {
      const offerId = String(req.params.id);
      const result = await OfferService.sendOffer(req.user!.orgId, offerId, {
        id: req.user!._id,
        name: req.user!.name,
        ip: req.ip,
      });
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getPublicOffer(req: Request, res: Response, next: NextFunction) {
    try {
      const token = String(req.params.token);
      const offer = await OfferService.getPublicOffer(token);
      res.json({ success: true, data: offer });
    } catch (error) {
      next(error);
    }
  }

  static async candidateRespond(req: Request, res: Response, next: NextFunction) {
    try {
      const token = String(req.params.token);
      const offer = await OfferService.candidateRespond(
        token,
        req.body.action,
        req.body.signature,
        req.body.comments
      );
      res.json({ success: true, data: offer });
    } catch (error) {
      next(error);
    }
  }
}
