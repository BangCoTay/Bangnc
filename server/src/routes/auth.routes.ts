import { Router, Request, Response, NextFunction } from 'express';
import { authController } from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema, forgotPasswordSchema, refreshTokenSchema } from '@ai-companions/shared';
import { authLimiter } from '../middleware/rateLimit';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), (req: Request, res: Response, next: NextFunction) => authController.register(req, res, next));
router.post('/login', authLimiter, validate(loginSchema), (req: Request, res: Response, next: NextFunction) => authController.login(req, res, next));
router.post('/refresh', validate(refreshTokenSchema), (req: Request, res: Response, next: NextFunction) => authController.refresh(req, res, next));
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), (req: Request, res: Response, next: NextFunction) => authController.forgotPassword(req, res, next));

export default router;
