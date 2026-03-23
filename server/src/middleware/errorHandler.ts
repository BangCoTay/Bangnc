import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Internal server error';

  if (statusCode >= 500) {
    logger.error({ err }, 'Server error');
  } else {
    logger.warn({ statusCode, message }, 'Client error');
  }

  res.status(statusCode).json({
    success: false,
    error: message,
  });
}
