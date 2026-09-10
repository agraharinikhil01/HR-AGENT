import { Router } from 'express';
import { DashboardController } from './dashboard.controller.js';
import { requireAuth } from '../../middleware/requireAuth.js';

const router = Router();
router.use(requireAuth);

router.get('/metrics', DashboardController.getMetrics);

export const dashboardRoutes = router;
