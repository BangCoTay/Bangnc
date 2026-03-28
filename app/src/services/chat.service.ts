import { api } from './api';
import { tokenStorage } from './tokenStorage';
import type { Conversation, Message, SendMessageRequest } from '@ai-companions/shared';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const chatService = {
  async listConversations(): Promise<Conversation[]> {
    const response = await api.get('/chat/conversations');
    return response.data.data;
  },

  async createConversation(characterId: string): Promise<Conversation> {
    const response = await api.post('/chat/conversations', { character_id: characterId });
    return response.data.data;
  },

  async getConversation(id: string, page: number = 1, limit: number = 50) {
    const response = await api.get(`/chat/conversations/${id}`, { params: { page, limit } });
    return response.data.data;
  },

  async deleteConversation(id: string): Promise<void> {
    await api.delete(`/chat/conversations/${id}`);
  },

  async sendMessage(conversationId: string, content: string): Promise<{ user_message: Message; ai_message: Message }> {
    const response = await api.post(`/chat/conversations/${conversationId}/messages`, { content });
    return response.data.data;
  },

  /**
   * Stream a message via SSE — calls onToken for each chunk, onDone when complete
   */
  async streamMessage(
    conversationId: string,
    content: string,
    callbacks: {
      onUserMessage: (msg: Message) => void;
      onToken: (token: string) => void;
      onDone: (aiMessage: Message) => void;
      onError: (error: string) => void;
    },
  ): Promise<void> {
    const token = await tokenStorage.getItem('access_token');
    const url = `${API_BASE}/chat/conversations/${conversationId}/stream`;

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      
      let lastProcessedIndex = 0;
      let buffer = '';
      let currentEvent = '';

      xhr.onreadystatechange = () => {
        if (xhr.readyState === 3 || xhr.readyState === 4) {
          const newData = xhr.responseText.slice(lastProcessedIndex);
          lastProcessedIndex = xhr.responseText.length;
          buffer += newData;

          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) {
              currentEvent = '';
              continue;
            }

            if (trimmed.startsWith('event: ')) {
              currentEvent = trimmed.slice(7).trim();
            } else if (trimmed.startsWith('data: ')) {
              if (!currentEvent) continue;
              const rawData = trimmed.slice(6).trim();
              try {
                const data = JSON.parse(rawData);
                switch (currentEvent) {
                  case 'user_message': callbacks.onUserMessage(data); break;
                  case 'token': callbacks.onToken(data.content); break;
                  case 'done': callbacks.onDone(data); break;
                  case 'error': callbacks.onError(data.error); break;
                }
              } catch (e) {
                // Ignore chunked JSON fragments
              }
            }
          }
        }

        if (xhr.readyState === 4) {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            const error = xhr.responseText || `HTTP ${xhr.status}`;
            callbacks.onError(error);
            reject(new Error(error));
          }
        }
      };

      xhr.onerror = () => {
        callbacks.onError('Network request failed');
        reject(new Error('Network request failed'));
      };

      xhr.send(JSON.stringify({ content }));
    });
  },

  async regenerate(conversationId: string): Promise<{ ai_message: Message }> {
    const response = await api.post(`/chat/conversations/${conversationId}/regenerate`);
    return response.data.data;
  },

  async sendGift(conversationId: string, giftId: string): Promise<{
    gift_message: Message;
    ai_message: Message;
    gift: any;
    new_balance: number;
  }> {
    const response = await api.post(`/chat/conversations/${conversationId}/gift`, { gift_id: giftId });
    return response.data.data;
  },

  async deleteMessage(conversationId: string, messageId: string): Promise<void> {
    await api.delete(`/chat/conversations/${conversationId}/messages/${messageId}`);
  },
};
