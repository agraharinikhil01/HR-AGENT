import { Router } from 'express';
import { CandidateController } from './candidate.controller.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { roleGuard } from '../../middleware/roleGuard.js';
import { validate } from '../../middleware/validate.js';
import {
  createCandidateSchema,
  publicApplySchema,
  updateStageSchema,
  overrideScoreSchema,
  addNoteSchema,
} from './candidate.schema.js';

const router = Router();

// Public application route
router.post('/public-apply/:orgSlug/:jobSlug', validate({ body: publicApplySchema }), CandidateController.publicApply);

// Authenticated recruitment routes
router.use(requireAuth);

router.post('/', roleGuard(['ORG_ADMIN', 'RECRUITER']), validate({ body: createCandidateSchema }), CandidateController.createCandidate);
router.get('/applications', CandidateController.listApplications);
router.get('/compare', CandidateController.compareCandidates);
router.get('/applications/:id', CandidateController.getApplicationById);
router.patch('/applications/:id/stage', roleGuard(['ORG_ADMIN', 'RECRUITER', 'HIRING_MANAGER']), validate({ body: updateStageSchema }), CandidateController.updateStage);
router.patch('/applications/:id/override-score', roleGuard(['ORG_ADMIN', 'RECRUITER']), validate({ body: overrideScoreSchema }), CandidateController.overrideScore);
router.post('/applications/:id/notes', validate({ body: addNoteSchema }), CandidateController.addNote);

export const candidateRoutes = router;
