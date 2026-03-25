import { api } from './api';
import type { CoinTransaction } from '@ai-companions/shared';

export const premiumService = {
  // ---- Coins ----
  async getBalance(): Promise<number> {
    const response = await api.get('/premium/balance');
    return response.data.data.balance;
  },

  async claimDailyBonus(): Promise<CoinTransaction> {
    const response = await api.post('/premium/daily-bonus');
    return response.data.data;
  },

  async getTransactions(page: number = 1, limit: number = 20) {
    const response = await api.get('/premium/transactions', { params: { page, limit } });
    return response.data.data;
  },

  // ---- Subscriptions ----
  async getSubscription() {
    const response = await api.get('/premium/subscription');
    return response.data.data;
  },

  async subscribe(plan: 'starter' | 'pro' | 'ultimate') {
    const response = await api.post('/premium/subscribe', { plan });
    return response.data.data;
  },

  async cancelSubscription(): Promise<void> {
    await api.post('/premium/cancel-subscription');
  },

  // ---- Image Generation ----
  async generateImage(prompt: string, style?: string) {
    const response = await api.post('/premium/generate', { prompt, style });
    return response.data.data;
  },

  async getGenerations(page: number = 1, limit: number = 20) {
    const response = await api.get('/premium/generations', { params: { page, limit } });
    return response.data.data;
  },

  async getGeneration(id: string) {
    const response = await api.get(`/premium/generations/${id}`);
    return response.data.data;
  },
};
