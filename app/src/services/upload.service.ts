import { supabase } from './supabase';

export const uploadService = {
  async uploadImage(uri: string, prefix = 'avatars'): Promise<string> {
    try {
      const extMatch = uri.match(/\.(\w+)$/);
      const ext = extMatch ? extMatch[1] : 'jpg';
      const fileName = `${prefix}/${Date.now()}.${ext}`;

      const response = await fetch(uri);
      if (!response.ok) throw new Error('Failed to fetch local file');
      const blob = await response.blob();

      const { data, error } = await supabase.storage
        .from('images')
        .upload(fileName, blob, {
          contentType: blob.type || `image/${ext === 'jpg' ? 'jpeg' : ext}`,
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
