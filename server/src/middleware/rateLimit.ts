import rateLimit from 'express-rate-limit';

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { success: false, error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, error: 'Too many auth requests, please try again later' },
});

export const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15,
  message: { success: false, error: 'Too many messages, please slow down' },
});
