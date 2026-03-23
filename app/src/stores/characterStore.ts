import { create } from 'zustand';
import type { Character, CharacterListQuery, CharacterGender, CharacterStyle } from '@ai-companions/shared';
import { characterService } from '../services/character.service';

interface CharacterState {
  characters: Character[];
  featured: Character[];
  myCharacters: Character[];
  favorites: Character[];
  selectedCharacter: Character | null;
  isLoading: boolean;
  isLoadingMore: boolean;
  page: number;
  hasMore: boolean;
  total: number;
  filters: {
    gender?: CharacterGender;
    style?: CharacterStyle;
    category?: string;
    search?: string;
    sort: 'popular' | 'newest' | 'name';
  };

  fetchCharacters: (reset?: boolean) => Promise<void>;
  fetchMore: () => Promise<void>;
  fetchFeatured: () => Promise<void>;
  fetchMyCharacters: () => Promise<void>;
  fetchFavorites: () => Promise<void>;
  fetchCharacterById: (id: string) => Promise<Character>;
  toggleFavorite: (id: string) => Promise<void>;
  setFilter: (key: string, value: any) => void;
  clearFilters: () => void;
  setSelectedCharacter: (character: Character | null) => void;
}

export const useCharacterStore = create<CharacterState>((set, get) => ({
  characters: [],
  featured: [],
  myCharacters: [],
  favorites: [],
  selectedCharacter: null,
  isLoading: false,
  isLoadingMore: false,
  page: 1,
  hasMore: true,
  total: 0,
  filters: { sort: 'popular' },

  fetchCharacters: async (reset = false) => {
    const state = get();
    if (state.isLoading) return;

    const page = reset ? 1 : state.page;
    set({ isLoading: reset || page === 1, isLoadingMore: !reset && page > 1 });

    try {
      const query: CharacterListQuery = {
        page,
        limit: 20,
        ...state.filters,
      };
      const result = await characterService.list(query);
      set({
        characters: reset || page === 1 ? result.data : [...state.characters, ...result.data],
        page: page + 1,
        hasMore: result.has_more,
        total: result.total,
        isLoading: false,
        isLoadingMore: false,
      });
    } catch {
      set({ isLoading: false, isLoadingMore: false });
    }
  },

  fetchMore: async () => {
    const state = get();
    if (!state.hasMore || state.isLoadingMore) return;
    await state.fetchCharacters(false);
  },

  fetchFeatured: async () => {
    try {
      const result = await characterService.list({ sort: 'popular', limit: 10 });
      set({ featured: result.data });
    } catch {}
  },

  fetchMyCharacters: async () => {
    try {
      const data = await characterService.getMyCharacters();
      set({ myCharacters: data });
    } catch {}
  },

  fetchFavorites: async () => {
    try {
      const data = await characterService.getFavorites();
      set({ favorites: data });
    } catch {}
  },

  fetchCharacterById: async (id) => {
    const character = await characterService.getById(id);
    set({ selectedCharacter: character });
    return character;
  },

  toggleFavorite: async (id) => {
    try {
      const result = await characterService.toggleFavorite(id);
      const updateFav = (chars: Character[]) =>
        chars.map((c) => (c.id === id ? { ...c, is_favorited: result.is_favorited } : c));

      set((state) => ({
        characters: updateFav(state.characters),
        featured: updateFav(state.featured),
        selectedCharacter:
          state.selectedCharacter?.id === id
            ? { ...state.selectedCharacter, is_favorited: result.is_favorited }
            : state.selectedCharacter,
      }));
    } catch {}
  },

  setFilter: (key, value) => {
    set((state) => ({
      filters: { ...state.filters, [key]: value },
      page: 1,
      hasMore: true,
    }));
  },

  clearFilters: () => {
    set({ filters: { sort: 'popular' }, page: 1, hasMore: true });
  },

  setSelectedCharacter: (character) => set({ selectedCharacter: character }),
}));
