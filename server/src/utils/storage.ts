import { supabaseAdmin } from '../config/supabase';
import { logger } from './logger';

/**
 * Ensures that the required Supabase Storage buckets exist and are public.
 */
export async function initializeStorage() {
  const buckets = ['audio', 'images'];

  try {
    const { data: existingBuckets, error: listError } = await supabaseAdmin.storage.listBuckets();
    
    if (listError) {
      logger.error({ err: listError }, 'Failed to list storage buckets');
      return;
    }

    const existingNames = existingBuckets?.map(b => b.name) || [];

    for (const bucketName of buckets) {
      if (!existingNames.includes(bucketName)) {
        logger.info(`Creating missing storage bucket: ${bucketName}`);
        
        const { error: createError } = await supabaseAdmin.storage.createBucket(bucketName, {
          public: true,
          allowedMimeTypes: bucketName === 'audio' ? ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'] : ['image/png', 'image/jpeg', 'image/webp'],
          fileSizeLimit: 10485760, // 10MB
        });

        if (createError) {
          logger.error({ err: createError, bucketName }, 'Failed to create bucket');
        } else {
          logger.info(`Successfully created bucket: ${bucketName}`);
        }
      }
    }
  } catch (err) {
    logger.error({ err }, 'Unexpected error during storage initialization');
  }
}
