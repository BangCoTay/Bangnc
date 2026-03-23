import express from 'express';
import cors from 'cors';
import { env, validateEnv } from './config/env';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimit';

// Routes
import authRoutes from './routes/auth.routes';
import characterRoutes from './routes/character.routes';
import chatRoutes from './routes/chat.routes';
import userRoutes from './routes/user.routes';

validateEnv();

const app = express();

// Global middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(generalLimiter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/characters', characterRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/user', userRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

// Start server
app.listen(env.PORT, () => {
  logger.info(`🚀 AI Companions server running on port ${env.PORT}`);
  logger.info(`📡 Environment: ${env.NODE_ENV}`);
});

export default app;
