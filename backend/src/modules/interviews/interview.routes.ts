import { Router } from 'express';
import { InterviewController } from './interview.controller.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { roleGuard } from '../../middleware/roleGuard.js';
import { validate } from '../../middleware/validate.js';
import { scheduleInterviewSchema, submitScorecardSchema } from './interview.schema.js';

const router = Router();

router.use(requireAuth);

router.post(
  '/schedule',
  roleGuard(['ORG_ADMIN', 'RECRUITER', 'HIRING_MANAGER']),
  validate({ body: scheduleInterviewSchema }),
  InterviewController.scheduleInterview
);
router.get('/', InterviewController.listInterviews);
router.get('/:id', InterviewController.getInterviewById);
router.post(
  '/:id/scorecards',
  roleGuard(['ORG_ADMIN', 'RECRUITER', 'HIRING_MANAGER', 'INTERVIEWER']),
  validate({ body: submitScorecardSchema }),
  InterviewController.submitScorecard
);
router.get('/:id/summary', InterviewController.getFeedbackSummary);

export const interviewRoutes = router;
