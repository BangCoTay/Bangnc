import { openai } from '../config/ai';
import { supabaseAdmin } from '../config/supabase';
import { coinService } from './coin.service';
import { IMAGE_GEN_COST } from '@ai-companions/shared';
import type { GenerationRequest } from '@ai-companions/shared';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export class GenerationService {
  /**
   * Generate an image using DALL-E 3
   */
  async generateImage(
    userId: string,
    prompt: string,
    style?: string,
  ): Promise<GenerationRequest> {
    // Check coin balance
    const balance = await coinService.getBalance(userId);
    if (balance < IMAGE_GEN_COST) {
      throw new AppError('Insufficient coins for image generation', 402);
    }

    // Create pending request
    const { data: request, error: insertErr } = await supabaseAdmin
      .from('generation_requests')
      .insert({
        user_id: userId,
        prompt,
        style: style || 'vivid',
        status: 'processing',
        coin_cost: IMAGE_GEN_COST,
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    try {
      // Deduct coins
      await coinService.deductCoins(userId, IMAGE_GEN_COST, 'spend', 'Image generation', request!.id);

      // Call DALL-E 3
      const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt: this.buildImagePrompt(prompt, style),
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        style: (style === 'natural' ? 'natural' : 'vivid') as 'vivid' | 'natural',
      });

      const imageUrl = response.data[0]?.url;
      if (!imageUrl) throw new Error('No image URL returned');

      // Upload to Supabase Storage
      const storedUrl = await this.uploadToStorage(imageUrl, userId, request!.id);

      // Update request with result
      await supabaseAdmin
        .from('generation_requests')
        .update({ status: 'completed', result_url: storedUrl })
        .eq('id', request!.id);

      logger.info({ userId, requestId: request!.id }, 'Image generated successfully');

      return {
        ...request,
        status: 'completed',
        result_url: storedUrl,
      } as GenerationRequest;
    } catch (err: any) {
      // Mark as failed
      await supabaseAdmin
        .from('generation_requests')
        .update({ status: 'failed', error_message: err.message })
        .eq('id', request!.id);

      // Refund coins
      await coinService.addCoins(userId, IMAGE_GEN_COST, 'refund', 'Image generation failed');

      logger.error({ err, userId }, 'Image generation failed');
      throw new AppError('Image generation failed: ' + err.message, 500);
    }
  }

  /**
   * List user's generation history
   */
  async listGenerations(userId: string, page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;

    const { data, count, error } = await supabaseAdmin
      .from('generation_requests')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return { data: (data || []) as GenerationRequest[], total: count || 0 };
  }

  /**
   * Get a single generation by ID
   */
  async getGeneration(id: string, userId: string): Promise<GenerationRequest> {
    const { data, error } = await supabaseAdmin
      .from('generation_requests')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !data) throw new AppError('Generation not found', 404);
    return data as GenerationRequest;
  }

  private buildImagePrompt(userPrompt: string, style?: string): string {
    return `High quality digital art. ${userPrompt}. Style: ${style || 'vivid anime illustration'}.`;
  }

  private async uploadToStorage(imageUrl: string, userId: string, requestId: string): Promise<string> {
    try {
      // Download image from OpenAI
      const response = await fetch(imageUrl);
      const buffer = await response.arrayBuffer();

      const fileName = `generations/${userId}/${requestId}.png`;

      const { error } = await supabaseAdmin.storage
        .from('images')
        .upload(fileName, Buffer.from(buffer), {
          contentType: 'image/png',
          cacheControl: '3600',
          upsert: true,
        });

      if (error) throw error;

      const { data: publicUrl } = supabaseAdmin.storage
        .from('images')
        .getPublicUrl(fileName);

      return publicUrl.publicUrl;
    } catch (err) {
      logger.error({ err }, 'Failed to upload to Storage, using original URL');
      return imageUrl; // Fallback to OpenAI URL
    }
  }
}

export const generationService = new GenerationService();
