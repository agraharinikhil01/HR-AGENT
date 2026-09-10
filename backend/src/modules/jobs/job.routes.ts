import { Router } from 'express';
import { JobController } from './job.controller.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { roleGuard } from '../../middleware/roleGuard.js';
import { validate } from '../../middleware/validate.js';
import { createJobSchema, updateJobSchema, aiGenerateJdSchema } from './job.schema.js';

const router = Router();

// Public Job routes (unauthenticated)
router.get('/public', JobController.listAllPublicJobs);
router.get('/public/:orgSlug/:jobSlug', JobController.getPublicJob);

// Authenticated recruitment routes
router.use(requireAuth);

router.get('/', JobController.listJobs);
router.post(
  '/',
  roleGuard(['ORG_ADMIN', 'RECRUITER']),
  validate({ body: createJobSchema }),
  JobController.createJob
);
router.post(
  '/ai-generate-jd',
  roleGuard(['ORG_ADMIN', 'RECRUITER']),
  validate({ body: aiGenerateJdSchema }),
  JobController.generateAiJd
);
router.get('/:id', JobController.getJobById);
router.patch(
  '/:id',
  roleGuard(['ORG_ADMIN', 'RECRUITER']),
  validate({ body: updateJobSchema }),
  JobController.updateJob
);
router.delete('/:id', roleGuard(['ORG_ADMIN']), JobController.deleteJob);

export const jobRoutes = router;
