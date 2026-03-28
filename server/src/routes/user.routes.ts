import { Router, Request, Response, NextFunction } from 'express';
import { userController } from '../controllers/user.controller';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { updateProfileSchema } from '@ai-companions/shared';

const router = Router();

router.get('/profile', authMiddleware, (req: Request, res: Response, next: NextFunction) => userController.getProfile(req, res, next));
router.put('/profile', authMiddleware, validate(updateProfileSchema), (req: Request, res: Response, next: NextFunction) => userController.updateProfile(req, res, next));
router.get('/favorites', authMiddleware, (req: Request, res: Response, next: NextFunction) => userController.getFavorites(req, res, next));
router.get('/plans', (req: Request, res: Response, next: NextFunction) => userController.getPlans(req, res, next));

export default router;
