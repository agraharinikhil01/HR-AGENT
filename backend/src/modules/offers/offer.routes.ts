import { Router } from 'express';
import { OfferController } from './offer.controller.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { roleGuard } from '../../middleware/roleGuard.js';
import { validate } from '../../middleware/validate.js';
import {
  createOfferSchema,
  approveOfferSchema,
  candidateAcceptRejectSchema,
} from './offer.schema.js';

const router = Router();

// Public Candidate Offer Portal routes (by token)
router.get('/public/:token', OfferController.getPublicOffer);
router.post(
  '/public/:token/respond',
  validate({ body: candidateAcceptRejectSchema }),
  OfferController.candidateRespond
);

// Authenticated recruitment & approval routes
router.use(requireAuth);

router.post(
  '/',
  roleGuard(['ORG_ADMIN', 'RECRUITER']),
  validate({ body: createOfferSchema }),
  OfferController.createOffer
);
router.get('/', OfferController.listOffers);
router.get('/:id', OfferController.getOfferById);
router.post(
  '/:id/approve',
  roleGuard(['ORG_ADMIN', 'HIRING_MANAGER', 'FINANCE_APPROVER']),
  validate({ body: approveOfferSchema }),
  OfferController.approveOffer
);
router.post(
  '/:id/send',
  roleGuard(['ORG_ADMIN', 'RECRUITER']),
  OfferController.sendOffer
);

export const offerRoutes = router;
