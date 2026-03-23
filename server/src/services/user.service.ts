import { supabaseAdmin } from '../config/supabase';
import type { Profile, UpdateProfileRequest, Character } from '@ai-companions/shared';
import { NotFoundError } from '../utils/errors';

export class UserService {
  async getProfile(userId: string): Promise<Profile> {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) throw new NotFoundError('Profile');
    return data as Profile;
  }

  async updateProfile(userId: string, updates: UpdateProfileRequest): Promise<Profile> {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data as Profile;
  }

  async getFavorites(userId: string): Promise<Character[]> {
    const { data, error } = await supabaseAdmin
      .from('user_favorites')
      .select(`
        character:characters(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map((f: any) => f.character).filter(Boolean) as Character[];
  }
}

export const userService = new UserService();
