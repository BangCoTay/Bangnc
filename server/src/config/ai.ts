import OpenAI from 'openai';
import { env } from './env';

export const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

export const AI_CONFIG = {
  defaultModel: 'gpt-4o-mini' as const,
  qualityModel: 'gpt-4o' as const,
  maxTokens: 1000,
  temperature: 0.85,
  presencePenalty: 0.6,
  frequencyPenalty: 0.3,
};
