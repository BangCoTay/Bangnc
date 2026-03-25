-- ============================================================
-- AI Companions Platform — V2 Migration
-- Run this in your Supabase SQL Editor AFTER the v1 migration
-- ============================================================

-- Add is_group flag to conversations
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS is_group BOOLEAN DEFAULT false;

-- Add voice_id to characters
ALTER TABLE public.characters
  ADD COLUMN IF NOT EXISTS voice_id TEXT DEFAULT 'nova';

-- Add audio_url to messages (for voice messages)
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS audio_url TEXT;

-- ============================================================
-- PUSH NOTIFICATION TOKENS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.push_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  device_type TEXT DEFAULT 'unknown',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, token)
);

CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON public.push_tokens(user_id);

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own push tokens" ON public.push_tokens
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- MODERATION FLAGS (for content moderation pipeline)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.moderation_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('message', 'character', 'image')),
  content_id UUID,
  flagged_categories JSONB DEFAULT '[]'::jsonb,
  severity TEXT DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high')),
  action_taken TEXT DEFAULT 'none' CHECK (action_taken IN ('none', 'warned', 'blocked', 'removed')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_moderation_user ON public.moderation_flags(user_id);
ALTER TABLE public.moderation_flags ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- SUPABASE STORAGE BUCKET (for generated images and voice)
-- ============================================================
-- Run these via Supabase Dashboard > Storage > New Bucket
-- Bucket name: "images" (public)
-- Bucket name: "audio"  (public)

-- ============================================================
-- RPC: Increment functions (if not already exist)
-- ============================================================
CREATE OR REPLACE FUNCTION public.increment_chat_count(char_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.characters SET chat_count = chat_count + 1 WHERE id = char_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.increment_message_count(conv_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.conversations SET message_count = message_count + 1 WHERE id = conv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
