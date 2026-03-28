import { api } from './api';

export const voiceService = {
  async textToSpeech(text: string, voice: string = 'nova'): Promise<{ audioUrl: string; newBalance?: number }> {
    const response = await api.post('/voice/tts', { text, voice });
    return response.data.data;
  },

  async speechToText(audioBase64: string, mimeType: string = 'audio/mpeg'): Promise<string> {
    const response = await api.post('/voice/stt', { audio_base64: audioBase64, mime_type: mimeType });
    return response.data.data.text;
  },
};
