import { supabaseAdmin } from '../config/supabase';
import { logger } from '../utils/logger';

interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
}

export class NotificationService {
  /**
   * Register a push token for a user
   */
  async registerPushToken(userId: string, token: string, deviceType: string = 'unknown'): Promise<void> {
    const { error } = await supabaseAdmin
      .from('push_tokens')
      .upsert(
        { user_id: userId, token, device_type: deviceType },
        { onConflict: 'user_id,token' },
      );

    if (error) {
      logger.error({ error, userId }, 'Failed to register push token');
      throw error;
    }
    logger.info({ userId, deviceType }, 'Push token registered');
  }

  /**
   * Remove a push token
   */
  async removePushToken(userId: string, token: string): Promise<void> {
    await supabaseAdmin
      .from('push_tokens')
      .delete()
      .eq('user_id', userId)
      .eq('token', token);
  }

  /**
   * Send push notification to a user via Expo Push API
   */
  async sendPushNotification(userId: string, payload: PushPayload): Promise<void> {
    try {
      // Get user's push tokens
      const { data: tokens } = await supabaseAdmin
        .from('push_tokens')
        .select('token')
        .eq('user_id', userId);

      if (!tokens || tokens.length === 0) return;

      const messages = tokens.map((t: any) => ({
        to: t.token,
        sound: 'default',
        title: payload.title,
        body: payload.body,
        data: payload.data || {},
      }));

      // Send via Expo Push API
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });

      if (!response.ok) {
        logger.error({ status: response.status, userId }, 'Expo Push API error');
      } else {
        logger.info({ userId, tokenCount: tokens.length }, 'Push notification sent');
      }
    } catch (err) {
      logger.error({ err, userId }, 'Failed to send push notification');
    }
  }

  /**
   * Send chat notification — when AI responds and app is backgrounded
   */
  async notifyNewMessage(userId: string, characterName: string, preview: string, conversationId: string): Promise<void> {
    await this.sendPushNotification(userId, {
      title: characterName,
      body: preview.substring(0, 100),
      data: { type: 'chat', conversationId },
    });
  }
}

export const notificationService = new NotificationService();
