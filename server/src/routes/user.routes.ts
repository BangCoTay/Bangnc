import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { updateProfileSchema } from '@ai-companions/shared';

const router = Router();

router.get('/profile', authMiddleware, (req, res, next) => userController.getProfile(req, res, next));
router.put('/profile', authMiddleware, validate(updateProfileSchema), (req, res, next) => userController.updateProfile(req, res, next));
router.get('/favorites', authMiddleware, (req, res, next) => userController.getFavorites(req, res, next));
router.get('/plans', (req, res, next) => userController.getPlans(req as any, res, next));

export default router;
