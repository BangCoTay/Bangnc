import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { coinService } from '../services/coin.service';
import { subscriptionService } from '../services/subscription.service';
import { generationService } from '../services/generation.service';
import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../middleware/auth';

const router = Router();

// ---- Coins ----
router.get('/balance', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const balance = await coinService.getBalance(req.user!.id);
    res.json({ success: true, data: { balance } });
  } catch (err) { next(err); }
});

router.post('/daily-bonus', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tx = await coinService.claimDailyBonus(req.user!.id);
    res.json({ success: true, data: tx });
  } catch (err) { next(err); }
});

router.get('/transactions', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await coinService.getTransactionHistory(req.user!.id, page, limit);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// ---- Subscriptions ----
router.get('/subscription', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const sub = await subscriptionService.getSubscription(req.user!.id);
    res.json({ success: true, data: sub });
  } catch (err) { next(err); }
});

router.post('/subscribe', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { plan } = req.body;
    if (!['starter', 'pro', 'ultimate'].includes(plan)) {
      return res.status(400).json({ success: false, error: 'Invalid plan' });
    }
    const sub = await subscriptionService.subscribe(req.user!.id, plan);
    res.json({ success: true, data: sub });
  } catch (err) { next(err); }
});

router.post('/cancel-subscription', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await subscriptionService.cancelSubscription(req.user!.id);
    res.json({ success: true, message: 'Subscription cancelled' });
  } catch (err) { next(err); }
});

// ---- Image Generation ----
router.post('/generate', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { prompt, style } = req.body;
    if (!prompt) {
      return res.status(400).json({ success: false, error: 'Prompt is required' });
    }
    const result = await generationService.generateImage(req.user!.id, prompt, style);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.get('/generations', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await generationService.listGenerations(req.user!.id, page, limit);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.get('/generations/:id', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await generationService.getGeneration(req.params.id, req.user!.id);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

export default router;
