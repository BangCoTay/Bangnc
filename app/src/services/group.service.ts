import { api } from './api';
import type { Character, Conversation, Message } from '@ai-companions/shared';

export const groupService = {
  async createGroup(characterIds: string[]): Promise<Conversation> {
    const response = await api.post('/groups', { character_ids: characterIds });
    return response.data.data;
  },

  async getGroupCharacters(groupId: string): Promise<Character[]> {
    const response = await api.get(`/groups/${groupId}/characters`);
    return response.data.data;
  },

  async addCharacter(groupId: string, characterId: string): Promise<void> {
    await api.post(`/groups/${groupId}/characters`, { character_id: characterId });
  },

  async removeCharacter(groupId: string, characterId: string): Promise<void> {
    await api.delete(`/groups/${groupId}/characters/${characterId}`);
  },

  async sendMessage(groupId: string, content: string): Promise<{ user_message: Message; ai_messages: any[] }> {
    const response = await api.post(`/groups/${groupId}/messages`, { content });
    return response.data.data;
  },
};
