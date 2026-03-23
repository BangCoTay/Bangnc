import { api } from './api';
import type { Conversation, Message, SendMessageRequest } from '@ai-companions/shared';

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

  async regenerate(conversationId: string): Promise<{ ai_message: Message }> {
    const response = await api.post(`/chat/conversations/${conversationId}/regenerate`);
    return response.data.data;
  },
};
