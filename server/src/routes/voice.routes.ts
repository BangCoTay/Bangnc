import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { voiceService } from '../services/voice.service';
import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../middleware/auth';

const router = Router();

// Text-to-speech
router.post('/tts', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { text, voice } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, error: 'Text is required' });
    }
    const audioUrl = await voiceService.textToSpeech(text, voice || 'nova', req.user!.id);
    res.json({ success: true, data: { audio_url: audioUrl } });
  } catch (err) { next(err); }
});

// Speech-to-text (expects base64 audio in body)
router.post('/stt', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { audio_base64, mime_type } = req.body;
    if (!audio_base64) {
      return res.status(400).json({ success: false, error: 'audio_base64 is required' });
    }
    const buffer = Buffer.from(audio_base64, 'base64');
    const text = await voiceService.speechToText(buffer, mime_type);
    res.json({ success: true, data: { text } });
  } catch (err) { next(err); }
});

export default router;
