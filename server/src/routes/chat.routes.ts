import { Router } from 'express';
import { chatController } from '../controllers/chat.controller';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { sendMessageSchema } from '@ai-companions/shared';
import { chatLimiter } from '../middleware/rateLimit';

const router = Router();

router.get('/conversations', authMiddleware, (req, res, next) => chatController.listConversations(req, res, next));
router.post('/conversations', authMiddleware, (req, res, next) => chatController.createConversation(req, res, next));
router.get('/conversations/:id', authMiddleware, (req, res, next) => chatController.getConversation(req, res, next));
router.delete('/conversations/:id', authMiddleware, (req, res, next) => chatController.deleteConversation(req, res, next));
router.post('/conversations/:id/messages', authMiddleware, chatLimiter, validate(sendMessageSchema), (req, res, next) => chatController.sendMessage(req, res, next));
router.post('/conversations/:id/regenerate', authMiddleware, chatLimiter, (req, res, next) => chatController.regenerate(req, res, next));

export default router;
