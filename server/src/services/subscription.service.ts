import { supabaseAdmin } from '../config/supabase';
import { coinService } from './coin.service';
import type { Subscription, SubscriptionPlan, SubscriptionTier, Profile } from '@ai-companions/shared';
import { PLAN_LIMITS } from '@ai-companions/shared';
import { AppError, NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';

export class SubscriptionService {
  async getSubscription(userId: string): Promise<Subscription | null> {
    const { data } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    return (data as Subscription) || null;
  }

  async subscribe(userId: string, plan: SubscriptionPlan): Promise<Subscription> {
    // Cancel any existing subscription
    await supabaseAdmin
      .from('subscriptions')
      .update({ status: 'cancelled' })
      .eq('user_id', userId)
      .eq('status', 'active');

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    // Create new subscription
    const { data: sub, error } = await supabaseAdmin
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan,
        status: 'active',
        provider: 'internal',
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Update profile tier
    await supabaseAdmin
      .from('profiles')
      .update({ subscription_tier: plan })
      .eq('id', userId);

    // Grant monthly coin allowance
    const coinAllowance: Record<SubscriptionPlan, number> = {
      starter: 500,
      pro: 2000,
      ultimate: 5000,
    };
    await coinService.addCoins(userId, coinAllowance[plan], 'reward', `${plan} plan monthly coins`);

    logger.info({ userId, plan }, 'Subscription created');
    return sub as Subscription;
  }

  async cancelSubscription(userId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('subscriptions')
      .update({ status: 'cancelled' })
      .eq('user_id', userId)
      .eq('status', 'active');

    if (error) throw error;

    // Revert to free tier
    await supabaseAdmin
      .from('profiles')
      .update({ subscription_tier: 'free' })
      .eq('id', userId);

    logger.info({ userId }, 'Subscription cancelled');
  }

  /**
   * Check if a user can send a message based on their tier's daily limit
   */
  async checkMessageLimit(userId: string): Promise<{ allowed: boolean; remaining: number }> {
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('subscription_tier, daily_message_count, last_message_reset_at')
      .eq('id', userId)
      .single();

    if (error || !profile) throw new NotFoundError('Profile');

    // Reset daily count if it's a new day
    const lastReset = new Date(profile.last_message_reset_at);
    const now = new Date();
    if (lastReset.toDateString() !== now.toDateString()) {
      await supabaseAdmin
        .from('profiles')
        .update({ daily_message_count: 0, last_message_reset_at: now.toISOString() })
        .eq('id', userId);
      profile.daily_message_count = 0;
    }

    const tier = profile.subscription_tier as SubscriptionTier;
    const limits = PLAN_LIMITS[tier] || PLAN_LIMITS.free;
    const dailyLimit = limits.daily_messages;
    const remaining = Math.max(0, dailyLimit - profile.daily_message_count);

    return { allowed: remaining > 0, remaining };
  }

  /**
   * Increment daily message count
   */
  async incrementMessageCount(userId: string): Promise<void> {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('daily_message_count')
      .eq('id', userId)
      .single();

    if (profile) {
      await supabaseAdmin
        .from('profiles')
        .update({ daily_message_count: (profile.daily_message_count || 0) + 1 })
        .eq('id', userId);
    }
  }
}

export const subscriptionService = new SubscriptionService();
