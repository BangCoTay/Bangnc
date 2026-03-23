import { api } from './api';
import type { Character, CharacterListQuery, PaginatedResponse, CreateCharacterRequest } from '@ai-companions/shared';

export const characterService = {
  async list(query: CharacterListQuery = {}): Promise<PaginatedResponse<Character>> {
    const response = await api.get('/characters', { params: query });
    return response.data;
  },

  async getById(id: string): Promise<Character> {
    const response = await api.get(`/characters/${id}`);
    return response.data.data;
  },

  async create(data: CreateCharacterRequest): Promise<Character> {
    const response = await api.post('/characters', data);
    return response.data.data;
  },

  async update(id: string, data: Partial<CreateCharacterRequest>): Promise<Character> {
    const response = await api.put(`/characters/${id}`, data);
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/characters/${id}`);
  },

  async toggleFavorite(id: string): Promise<{ is_favorited: boolean }> {
    const response = await api.post(`/characters/${id}/favorite`);
    return response.data.data;
  },

  async getMyCharacters(): Promise<Character[]> {
    const response = await api.get('/characters/me');
    return response.data.data;
  },

  async getFavorites(): Promise<Character[]> {
    const response = await api.get('/user/favorites');
    return response.data.data;
  },
};
