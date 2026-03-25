import { openai } from '../config/ai';
import { supabaseAdmin } from '../config/supabase';
import { coinService } from './coin.service';
import { TTS_COST } from '@ai-companions/shared';
import { logger } from '../utils/logger';

export class VoiceService {
  /**
   * Convert text to speech using OpenAI TTS API
   */
  async textToSpeech(
    text: string,
    voice: string = 'nova',
    userId?: string,
  ): Promise<string> {
    try {
      // Deduct coins if userId is provided
      if (userId) {
        await coinService.deductCoins(userId, TTS_COST, 'spend', 'Text-to-speech generation');
      }

      const response = await openai.audio.speech.create({
        model: 'tts-1',
        voice: voice as 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer',
        input: text,
        response_format: 'mp3',
      });

      // Get audio as buffer
      const buffer = Buffer.from(await response.arrayBuffer());

      // Upload to Supabase Storage
      const fileName = `voice/${Date.now()}-${Math.random().toString(36).slice(2)}.mp3`;

      const { error: uploadErr } = await supabaseAdmin.storage
        .from('audio')
        .upload(fileName, buffer, {
          contentType: 'audio/mpeg',
          cacheControl: '3600',
        });

      if (uploadErr) throw uploadErr;

      const { data: publicUrl } = supabaseAdmin.storage
        .from('audio')
        .getPublicUrl(fileName);

      logger.info({ voice, textLength: text.length }, 'TTS generated');
      return publicUrl.publicUrl;
    } catch (err: any) {
      // Refund coins on failure
      if (userId) {
        await coinService.addCoins(userId, TTS_COST, 'refund', 'TTS generation failed').catch(() => {});
      }
      logger.error({ err }, 'TTS failed');
      throw err;
    }
  }

  /**
   * Convert speech to text using OpenAI Whisper API
   */
  async speechToText(audioBuffer: Buffer, mimeType: string = 'audio/mpeg'): Promise<string> {
    try {
      // Create a File-like object for the API
      const file = new File([audioBuffer], 'audio.mp3', { type: mimeType });

      const transcription = await openai.audio.transcriptions.create({
        model: 'whisper-1',
        file,
      });

      logger.info({ textLength: transcription.text.length }, 'STT completed');
      return transcription.text;
    } catch (err) {
      logger.error({ err }, 'STT failed');
      throw err;
    }
  }
}

export const voiceService = new VoiceService();
