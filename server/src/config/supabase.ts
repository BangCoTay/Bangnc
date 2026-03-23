import { createClient } from '@supabase/supabase-js';
import { env } from './env';

// Admin client with service role key - bypasses RLS
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Public client for auth operations
export const supabasePublic = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
