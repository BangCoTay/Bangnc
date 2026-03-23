import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';
import { seedCharacters } from './characters';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seed() {
  console.log('🌱 Seeding database...\n');

  // Check if characters already exist
  const { count } = await supabase
    .from('characters')
    .select('*', { count: 'exact', head: true })
    .eq('is_official', true);

  if (count && count > 0) {
    console.log(`⚠️  ${count} official characters already exist. Skipping seed.`);
    console.log('   To re-seed, delete existing official characters first.');
    return;
  }

  let success = 0;
  let failed = 0;

  for (const char of seedCharacters) {
    const { error } = await supabase.from('characters').insert({
      name: char.name,
      tagline: char.tagline,
      description: char.description,
      style: char.style,
      gender: char.gender,
      appearance: char.appearance,
      personality: char.personality,
      greeting_message: char.greeting_message,
      categories: char.categories,
      is_public: char.is_public,
      is_official: char.is_official,
      is_nsfw: char.is_nsfw || false,
      system_prompt: char.system_prompt || null,
      avatar_url: char.avatar_url || null,
      banner_url: char.banner_url || null,
      creator_id: null,
    });

    if (error) {
      console.error(`  ❌ Failed to insert "${char.name}":`, error.message);
      failed++;
    } else {
      console.log(`  ✅ ${char.name}`);
      success++;
    }
  }

  console.log(`\n🌱 Seed complete: ${success} inserted, ${failed} failed`);
}

seed().catch(console.error);
