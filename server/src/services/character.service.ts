import { supabaseAdmin } from '../config/supabase';
import type { Character, CharacterListQuery, PaginatedResponse, CreateCharacterRequest } from '@ai-companions/shared';
import { NotFoundError, ForbiddenError } from '../utils/errors';

export class CharacterService {
  async list(query: CharacterListQuery, userId?: string): Promise<PaginatedResponse<Character>> {
    const { page = 1, limit = 20, gender, style, category, sort = 'popular', search, is_nsfw } = query;
    const offset = (page - 1) * limit;

    let q = supabaseAdmin
      .from('characters')
      .select('*', { count: 'exact' })
      .eq('is_public', true);

    if (gender) q = q.eq('gender', gender);
    if (style) q = q.eq('style', style);
    if (category) q = q.contains('categories', [category]);
    if (is_nsfw !== undefined) q = q.eq('is_nsfw', is_nsfw);
    if (search) q = q.or(`name.ilike.%${search}%,tagline.ilike.%${search}%,description.ilike.%${search}%`);

    switch (sort) {
      case 'popular': q = q.order('chat_count', { ascending: false }); break;
      case 'newest': q = q.order('created_at', { ascending: false }); break;
      case 'name': q = q.order('name', { ascending: true }); break;
    }

    q = q.range(offset, offset + limit - 1);

    const { data, count, error } = await q;
    if (error) throw error;

    let characters = (data || []) as Character[];

    // Check favorites if user is authenticated
    if (userId && characters.length > 0) {
      const { data: favs } = await supabaseAdmin
        .from('user_favorites')
        .select('character_id')
        .eq('user_id', userId)
        .in('character_id', characters.map(c => c.id));
      
      const favSet = new Set((favs || []).map(f => f.character_id));
      characters = characters.map(c => ({ ...c, is_favorited: favSet.has(c.id) }));
    }

    return {
      data: characters,
      total: count || 0,
      page,
      limit,
      has_more: offset + limit < (count || 0),
    };
  }

  async getById(id: string, userId?: string): Promise<Character> {
    const { data, error } = await supabaseAdmin
      .from('characters')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) throw new NotFoundError('Character');

    let character = data as Character;

    if (userId) {
      const { data: fav } = await supabaseAdmin
        .from('user_favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('character_id', id)
        .single();
      
      character = { ...character, is_favorited: !!fav };
    }

    return character;
  }

  async create(data: CreateCharacterRequest, creatorId: string): Promise<Character> {
    const { data: character, error } = await supabaseAdmin
      .from('characters')
      .insert({ ...data, creator_id: creatorId })
      .select()
      .single();

    if (error) throw error;
    return character as Character;
  }

  async update(id: string, data: Partial<CreateCharacterRequest>, userId: string): Promise<Character> {
    // Check ownership
    const existing = await this.getById(id);
    if (existing.creator_id !== userId) throw new ForbiddenError('You can only edit your own characters');

    const { data: character, error } = await supabaseAdmin
      .from('characters')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return character as Character;
  }

  async delete(id: string, userId: string): Promise<void> {
    const existing = await this.getById(id);
    if (existing.creator_id !== userId) throw new ForbiddenError('You can only delete your own characters');

    const { error } = await supabaseAdmin.from('characters').delete().eq('id', id);
    if (error) throw error;
  }

  async toggleFavorite(characterId: string, userId: string): Promise<{ is_favorited: boolean }> {
    // Check if already favorited
    const { data: existing } = await supabaseAdmin
      .from('user_favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('character_id', characterId)
      .single();

    if (existing) {
      await supabaseAdmin.from('user_favorites').delete().eq('id', existing.id);
      const { error: rpcError } = await supabaseAdmin.rpc('decrement_favorite_count', { char_id: characterId });
      if (rpcError) {
        // Fallback: direct update
        await supabaseAdmin.from('characters').update({ favorite_count: 0 }).eq('id', characterId);
      }
      return { is_favorited: false };
    } else {
      await supabaseAdmin.from('user_favorites').insert({ user_id: userId, character_id: characterId });
      return { is_favorited: true };
    }
  }

  async getByCreator(creatorId: string): Promise<Character[]> {
    const { data, error } = await supabaseAdmin
      .from('characters')
      .select('*')
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as Character[];
  }
}

export const characterService = new CharacterService();
