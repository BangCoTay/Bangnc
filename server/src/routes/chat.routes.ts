import { Router, Request, Response, NextFunction } from 'express';
import { chatController } from '../controllers/chat.controller';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { sendMessageSchema } from '@ai-companions/shared';
import { chatLimiter } from '../middleware/rateLimit';

const router = Router();

router.get('/conversations', authMiddleware, (req: Request, res: Response, next: NextFunction) => chatController.listConversations(req, res, next));
router.post('/conversations', authMiddleware, (req: Request, res: Response, next: NextFunction) => chatController.createConversation(req, res, next));
router.get('/conversations/:id', authMiddleware, (req: Request, res: Response, next: NextFunction) => chatController.getConversation(req, res, next));
router.delete('/conversations/:id', authMiddleware, (req: Request, res: Response, next: NextFunction) => chatController.deleteConversation(req, res, next));
router.post('/conversations/:id/messages', authMiddleware, chatLimiter, validate(sendMessageSchema), (req: Request, res: Response, next: NextFunction) => chatController.sendMessage(req, res, next));
router.post('/conversations/:id/stream', authMiddleware, chatLimiter, validate(sendMessageSchema), (req: Request, res: Response, next: NextFunction) => chatController.streamMessage(req, res, next));
router.post('/conversations/:id/regenerate', authMiddleware, chatLimiter, (req: Request, res: Response, next: NextFunction) => chatController.regenerate(req, res, next));
router.post('/conversations/:id/gift', authMiddleware, chatLimiter, (req: Request, res: Response, next: NextFunction) => chatController.sendGift(req, res, next));
router.delete('/conversations/:id/messages/:messageId', authMiddleware, (req: Request, res: Response, next: NextFunction) => chatController.deleteMessage(req, res, next));

export default router;
