import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema, forgotPasswordSchema } from '@ai-companions/shared';
import { authLimiter } from '../middleware/rateLimit';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), (req, res, next) => authController.register(req, res, next));
router.post('/login', authLimiter, validate(loginSchema), (req, res, next) => authController.login(req, res, next));
router.post('/refresh', (req, res, next) => authController.refresh(req, res, next));
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), (req, res, next) => authController.forgotPassword(req, res, next));

export default router;
