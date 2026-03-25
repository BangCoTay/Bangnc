import { supabaseAdmin } from '../config/supabase';
import type { CoinTransaction, TransactionType, Profile } from '@ai-companions/shared';
import { AppError, NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';

export class CoinService {
  async getBalance(userId: string): Promise<number> {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('coin_balance')
      .eq('id', userId)
      .single();

    if (error || !data) throw new NotFoundError('Profile');
    return data.coin_balance;
  }

  async deductCoins(
    userId: string,
    amount: number,
    type: TransactionType,
    description: string,
    referenceId?: string,
  ): Promise<CoinTransaction> {
    const balance = await this.getBalance(userId);

    if (balance < amount) {
      throw new AppError('Insufficient coin balance', 402);
    }

    const newBalance = balance - amount;

    // Update balance
    await supabaseAdmin
      .from('profiles')
      .update({ coin_balance: newBalance })
      .eq('id', userId);

    // Record transaction
    const { data: tx, error } = await supabaseAdmin
      .from('coin_transactions')
      .insert({
        user_id: userId,
        amount: -amount,
        balance_after: newBalance,
        type,
        description,
        reference_id: referenceId || null,
      })
      .select()
      .single();

    if (error) throw error;
    logger.info({ userId, amount, newBalance }, 'Coins deducted');
    return tx as CoinTransaction;
  }

  async addCoins(
    userId: string,
    amount: number,
    type: TransactionType,
    description: string,
  ): Promise<CoinTransaction> {
    const balance = await this.getBalance(userId);
    const newBalance = balance + amount;

    await supabaseAdmin
      .from('profiles')
      .update({ coin_balance: newBalance })
      .eq('id', userId);

    const { data: tx, error } = await supabaseAdmin
      .from('coin_transactions')
      .insert({
        user_id: userId,
        amount,
        balance_after: newBalance,
        type,
        description,
      })
      .select()
      .single();

    if (error) throw error;
    logger.info({ userId, amount, newBalance }, 'Coins added');
    return tx as CoinTransaction;
  }

  async claimDailyBonus(userId: string): Promise<CoinTransaction> {
    // Check if already claimed today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: existing } = await supabaseAdmin
      .from('coin_transactions')
      .select('id')
      .eq('user_id', userId)
      .eq('type', 'daily_bonus')
      .gte('created_at', today.toISOString())
      .limit(1);

    if (existing && existing.length > 0) {
      throw new AppError('Daily bonus already claimed today', 409);
    }

    return this.addCoins(userId, 50, 'daily_bonus', 'Daily login bonus');
  }

  async getTransactionHistory(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ transactions: CoinTransaction[]; total: number }> {
    const offset = (page - 1) * limit;

    const { data, count, error } = await supabaseAdmin
      .from('coin_transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return {
      transactions: (data || []) as CoinTransaction[],
      total: count || 0,
    };
  }
}

export const coinService = new CoinService();
