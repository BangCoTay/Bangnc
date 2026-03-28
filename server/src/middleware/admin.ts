import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { UnauthorizedError } from '../utils/errors';

export async function adminMiddleware(req: AuthRequest, _res: Response, next: NextFunction) {
  try {
    if (!req.user || !req.user.email) {
      throw new UnauthorizedError('Unauthorized');
    }

    if (req.user.email.toLowerCase() !== 'vankhai15052005@gmail.com') {
      throw new UnauthorizedError('Forbidden: Admin access required');
    }

    next();
  } catch (err) {
    next(err);
  }
}
