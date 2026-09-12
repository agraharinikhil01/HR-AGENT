import { Router } from 'express';
import { CandidateController } from './candidate.controller.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { roleGuard } from '../../middleware/roleGuard.js';
import { validate } from '../../middleware/validate.js';
import { uploadResume } from '../../middleware/upload.js';
import {
  createCandidateSchema,
  publicApplySchema,
  updateStageSchema,
  overrideScoreSchema,
  addNoteSchema,
  updateCandidateProfileSchema,
  respondOfferSchema,
} from './candidate.schema.js';

const router = Router();

// Public application routes (unauthenticated)
router.post(
  '/public-apply',
  uploadResume.single('resume'),
  validate({ body: publicApplySchema }),
  CandidateController.publicApply
);
router.post(
  '/public-apply/:orgSlug/:jobSlug',
  uploadResume.single('resume'),
  validate({ body: publicApplySchema }),
  CandidateController.publicApply
);

// Authenticated recruitment & candidate routes
router.use(requireAuth);

// Candidate Self-Service Portal
router.get('/me/portal', CandidateController.getCandidatePortalData);
router.patch('/me/profile', validate({ body: updateCandidateProfileSchema }), CandidateController.updateCandidateProfile);
router.post('/me/offers/:id/respond', validate({ body: respondOfferSchema }), CandidateController.respondToOffer);
router.post('/me/resume', uploadResume.single('resume'), CandidateController.uploadCandidateResume);

// Resume streaming / download (authenticated)
router.get('/:id/resume', CandidateController.downloadResume);

// Recruiter / Admin routes
router.post('/', roleGuard(['ORG_ADMIN', 'RECRUITER']), validate({ body: createCandidateSchema }), CandidateController.createCandidate);
router.get('/applications', CandidateController.listApplications);
router.get('/compare', CandidateController.compareCandidates);
router.get('/applications/:id', CandidateController.getApplicationById);
router.patch('/applications/:id/stage', roleGuard(['ORG_ADMIN', 'RECRUITER', 'HIRING_MANAGER']), validate({ body: updateStageSchema }), CandidateController.updateStage);
router.post('/applications/:id/pick-best', roleGuard(['ORG_ADMIN', 'RECRUITER']), CandidateController.pickBestCandidate);
router.patch('/applications/:id/override-score', roleGuard(['ORG_ADMIN', 'RECRUITER']), validate({ body: overrideScoreSchema }), CandidateController.overrideScore);
router.post('/applications/:id/notes', validate({ body: addNoteSchema }), CandidateController.addNote);

export const candidateRoutes = router;

