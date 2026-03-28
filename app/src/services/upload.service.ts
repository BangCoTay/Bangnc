import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';

export const uploadService = {
  async uploadImage(uri: string, prefix = 'avatars'): Promise<string> {
    try {
      const extMatch = uri.match(/\.(\w+)$/);
      const ext = extMatch ? extMatch[1] : 'jpg';
      const fileName = `${prefix}/${Date.now()}.${ext}`;
      const contentType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;

      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
      });

      const { data, error } = await supabase.storage
        .from('images')
        .upload(fileName, decode(base64), {
          contentType,
          upsert: false,
        });

      if (error) {
        throw error;
      }

      const { data: publicUrlData } = supabase.storage
        .from('images')
        .getPublicUrl(fileName);

      return publicUrlData.publicUrl;
    } catch (e: any) {
      console.error('Upload Error:', e);
      throw new Error(e.message || 'Failed to upload image');
    }
  }
};
