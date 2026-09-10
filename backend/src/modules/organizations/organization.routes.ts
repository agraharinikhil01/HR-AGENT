import { Router } from 'express';
import { OrganizationController } from './organization.controller.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { roleGuard } from '../../middleware/roleGuard.js';
import { validate } from '../../middleware/validate.js';
import { updateOrgSchema, addDepartmentSchema, inviteMemberSchema } from './organization.schema.js';
import { acceptInviteSchema } from '../auth/auth.schema.js';

const router = Router();

// Public invitation acceptance
router.post('/accept-invite', validate({ body: acceptInviteSchema }), OrganizationController.acceptInvite);

// Authenticated organization routes
router.use(requireAuth);

router.get('/profile', OrganizationController.getDetails);
router.patch('/profile', roleGuard(['ORG_ADMIN']), validate({ body: updateOrgSchema }), OrganizationController.updateDetails);
router.post('/departments', roleGuard(['ORG_ADMIN']), validate({ body: addDepartmentSchema }), OrganizationController.addDepartment);
router.get('/members', OrganizationController.listMembers);
router.post('/members/invite', roleGuard(['ORG_ADMIN']), validate({ body: inviteMemberSchema }), OrganizationController.inviteMember);

export const organizationRoutes = router;
