-- ============================================================
-- AI Companions Platform — Database Migration
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. PROFILES (extends auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  coin_balance INTEGER DEFAULT 100 NOT NULL,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'starter', 'pro', 'ultimate')),
  daily_message_count INTEGER DEFAULT 0 NOT NULL,
  last_message_reset_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- 2. CHARACTERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.characters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  style TEXT DEFAULT 'anime' CHECK (style IN ('anime', 'realistic', 'cartoon', '3d', 'pixel')),
  gender TEXT DEFAULT 'female' CHECK (gender IN ('male', 'female', 'non-binary', 'other')),
  appearance JSONB DEFAULT '{}'::jsonb,
  personality JSONB DEFAULT '{}'::jsonb,
  system_prompt TEXT,
  greeting_message TEXT DEFAULT 'Hello! Nice to meet you!',
  categories TEXT[] DEFAULT '{}',
  chat_count INTEGER DEFAULT 0 NOT NULL,
  favorite_count INTEGER DEFAULT 0 NOT NULL,
  is_public BOOLEAN DEFAULT true,
  is_official BOOLEAN DEFAULT false,
  is_nsfw BOOLEAN DEFAULT false,
  creator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- 3. CONVERSATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_preview TEXT,
  message_count INTEGER DEFAULT 0 NOT NULL,
  memory_summary TEXT,
  memory_facts JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, character_id)
);

-- ============================================================
-- 4. MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'character', 'system')),
  character_id UUID REFERENCES public.characters(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  media_url TEXT,
  token_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- 5. USER FAVORITES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, character_id)
);

-- ============================================================
-- 6. SUBSCRIPTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('starter', 'pro', 'ultimate')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'past_due')),
  provider TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- 7. COIN TRANSACTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.coin_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'reward', 'spend', 'refund', 'daily_bonus')),
  description TEXT,
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- 8. GENERATION REQUESTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.generation_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  style TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  result_url TEXT,
  coin_cost INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- 9. GROUP CONVERSATION CHARACTERS (v2)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.group_conversation_characters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(conversation_id, character_id)
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Characters
CREATE INDEX IF NOT EXISTS idx_characters_public ON public.characters(is_public, created_at DESC) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_characters_creator ON public.characters(creator_id);
CREATE INDEX IF NOT EXISTS idx_characters_categories ON public.characters USING GIN(categories);
CREATE INDEX IF NOT EXISTS idx_characters_gender_style ON public.characters(gender, style);
CREATE INDEX IF NOT EXISTS idx_characters_chat_count ON public.characters(chat_count DESC);
CREATE INDEX IF NOT EXISTS idx_characters_name_search ON public.characters USING GIN(to_tsvector('english', name || ' ' || COALESCE(tagline, '') || ' ' || COALESCE(description, '')));

-- Conversations
CREATE INDEX IF NOT EXISTS idx_conversations_user ON public.conversations(user_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_character ON public.conversations(character_id);

-- Messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id, created_at ASC);

-- User favorites
CREATE INDEX IF NOT EXISTS idx_favorites_user ON public.user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_character ON public.user_favorites(character_id);

-- Coin transactions
CREATE INDEX IF NOT EXISTS idx_transactions_user ON public.coin_transactions(user_id, created_at DESC);

-- Generation requests
CREATE INDEX IF NOT EXISTS idx_generations_user ON public.generation_requests(user_id, created_at DESC);

-- ============================================================
-- RLS POLICIES
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generation_requests ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users can view any profile" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Characters
CREATE POLICY "Anyone can view public characters" ON public.characters FOR SELECT USING (is_public = true OR creator_id = auth.uid());
CREATE POLICY "Auth users can create characters" ON public.characters FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators can update own characters" ON public.characters FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Creators can delete own characters" ON public.characters FOR DELETE USING (auth.uid() = creator_id);

-- Conversations
CREATE POLICY "Users can view own conversations" ON public.conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own conversations" ON public.conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own conversations" ON public.conversations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own conversations" ON public.conversations FOR DELETE USING (auth.uid() = user_id);

-- Messages
CREATE POLICY "Users can view messages in own conversations" ON public.messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.conversations WHERE conversations.id = messages.conversation_id AND conversations.user_id = auth.uid()));
CREATE POLICY "Users can insert messages in own conversations" ON public.messages FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.conversations WHERE conversations.id = messages.conversation_id AND conversations.user_id = auth.uid()));

-- User favorites
CREATE POLICY "Users can view own favorites" ON public.user_favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add favorites" ON public.user_favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove favorites" ON public.user_favorites FOR DELETE USING (auth.uid() = user_id);

-- Subscriptions
CREATE POLICY "Users can view own subscription" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);

-- Coin transactions
CREATE POLICY "Users can view own transactions" ON public.coin_transactions FOR SELECT USING (auth.uid() = user_id);

-- Generation requests
CREATE POLICY "Users can view own generations" ON public.generation_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create generations" ON public.generation_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- AUTO-TRIGGER: Create profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- HELPER: Update updated_at timestamp
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER characters_updated_at BEFORE UPDATE ON public.characters FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER generation_requests_updated_at BEFORE UPDATE ON public.generation_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
