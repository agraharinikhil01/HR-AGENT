import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { validate } from '../../middleware/validate.js';
import { registerOrgSchema, registerUserSchema, loginSchema } from './auth.schema.js';
import { requireAuth } from '../../middleware/requireAuth.js';

const router = Router();

router.post('/register', validate({ body: registerOrgSchema }), AuthController.registerOrg);
router.post('/register-user', validate({ body: registerUserSchema }), AuthController.registerUser);
router.post('/login', validate({ body: loginSchema }), AuthController.login);
router.post('/refresh', AuthController.refresh);
router.post('/logout', AuthController.logout);
router.get('/me', requireAuth, AuthController.getMe);

export const authRoutes = router;
