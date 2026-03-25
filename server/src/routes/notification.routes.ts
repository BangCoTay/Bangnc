import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { notificationService } from '../services/notification.service';
import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../middleware/auth';

const router = Router();

// Register push token
router.post('/register', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { token, device_type } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, error: 'Push token is required' });
    }
    await notificationService.registerPushToken(req.user!.id, token, device_type);
    res.json({ success: true, message: 'Push token registered' });
  } catch (err) { next(err); }
});

// Unregister push token
router.post('/unregister', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, error: 'Push token is required' });
    }
    await notificationService.removePushToken(req.user!.id, token);
    res.json({ success: true, message: 'Push token removed' });
  } catch (err) { next(err); }
});

export default router;
