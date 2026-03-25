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

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Stream request failed' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Parse SSE events from buffer
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      let currentEvent = '';
      for (const line of lines) {
        if (line.startsWith('event: ')) {
          currentEvent = line.slice(7).trim();
        } else if (line.startsWith('data: ') && currentEvent) {
          const data = line.slice(6);
          try {
            const parsed = JSON.parse(data);
            switch (currentEvent) {
              case 'user_message':
                callbacks.onUserMessage(parsed);
                break;
              case 'token':
                callbacks.onToken(parsed.content);
                break;
              case 'done':
                callbacks.onDone(parsed);
                break;
              case 'error':
                callbacks.onError(parsed.error);
                break;
            }
          } catch {}
          currentEvent = '';
        } else if (line === '') {
          currentEvent = '';
        }
      }
    }
  },

  async regenerate(conversationId: string): Promise<{ ai_message: Message }> {
    const response = await api.post(`/chat/conversations/${conversationId}/regenerate`);
    return response.data.data;
  },
};
