// ============================================================
// AI Companions — Shared Types
// ============================================================

// ---- User / Profile ----
export interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  coin_balance: number;
  subscription_tier: SubscriptionTier;
  daily_message_count: number;
  last_message_reset_at: string;
  created_at: string;
  updated_at: string;
  is_admin?: boolean;
}

export type SubscriptionTier = 'free' | 'starter' | 'pro' | 'ultimate';

// ---- Character ----
export interface Character {
  id: string;
  name: string;
  tagline: string | null;
  description: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  style: CharacterStyle;
  gender: CharacterGender;
  appearance: CharacterAppearance;
  personality: CharacterPersonality;
  system_prompt: string | null;
  greeting_message: string;
  categories: string[];
  chat_count: number;
  favorite_count: number;
  is_public: boolean;
  is_official: boolean;
  is_nsfw: boolean;
  creator_id: string | null;
  created_at: string;
  updated_at: string;
  // Virtual fields
  is_favorited?: boolean;
  voice_id?: string;
}

export type CharacterStyle = 'anime' | 'realistic' | 'cartoon' | '3d' | 'pixel';
export type CharacterGender = 'male' | 'female' | 'non-binary' | 'other';

export interface CharacterAppearance {
  hair_color?: string;
  eye_color?: string;
  body_type?: string;
  outfit?: string;
  distinguishing_features?: string;
  age_appearance?: string;
}

export interface CharacterPersonality {
  traits?: string[];
  interests?: string[];
  communication_style?: string;
  backstory?: string;
  quirks?: string[];
  likes?: string[];
  dislikes?: string[];
  speaking_tone?: string;
}

// ---- Conversation ----
export interface Conversation {
  id: string;
  user_id: string;
  character_id: string;
  last_message_at: string;
  last_message_preview: string | null;
  message_count: number;
  memory_summary: string | null;
  memory_facts: MemoryFact[];
  is_group: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  character?: Character;
}

export interface MemoryFact {
  key: string;
  value: string;
  confidence: number;
}

// ---- Message ----
export interface Message {
  id: string;
  conversation_id: string;
  sender_type: SenderType;
  character_id: string | null;
  character?: Pick<Character, 'id' | 'name' | 'avatar_url' | 'voice_id'>;
  content: string;
  media_url: string | null;
  audio_url: string | null;
  token_count: number;
  created_at: string;
}

export type SenderType = 'user' | 'character' | 'system';

// ---- Favorites ----
export interface UserFavorite {
  id: string;
  user_id: string;
  character_id: string;
  created_at: string;
  character?: Character;
}

// ---- Subscription ----
export interface Subscription {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  provider: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export type SubscriptionPlan = 'starter' | 'pro' | 'ultimate';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'past_due';

// ---- Coin Transactions ----
export interface CoinTransaction {
  id: string;
  user_id: string;
  amount: number;
  balance_after: number;
  type: TransactionType;
  description: string | null;
  reference_id: string | null;
  created_at: string;
}

export type TransactionType = 'purchase' | 'reward' | 'spend' | 'refund' | 'daily_bonus';

// ---- Generation Requests ----
export interface GenerationRequest {
  id: string;
  user_id: string;
  prompt: string;
  style: string | null;
  status: GenerationStatus;
  result_url: string | null;
  coin_cost: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export type GenerationStatus = 'pending' | 'processing' | 'completed' | 'failed';

// ============================================================
// API Request / Response Types
// ============================================================

// Auth
export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
  display_name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: Profile;
  access_token: string;
  refresh_token: string;
}

// Characters
export interface CharacterListQuery {
  page?: number;
  limit?: number;
  gender?: CharacterGender;
  style?: CharacterStyle;
  category?: string;
  sort?: 'popular' | 'newest' | 'name';
  search?: string;
  is_nsfw?: boolean;
}

export interface CreateCharacterRequest {
  name: string;
  tagline?: string;
  description?: string;
  avatar_url?: string;
  banner_url?: string;
  style?: CharacterStyle;
  gender?: CharacterGender;
  appearance?: CharacterAppearance;
  personality?: CharacterPersonality;
  system_prompt?: string;
  greeting_message?: string;
  categories?: string[];
  is_public?: boolean;
  is_nsfw?: boolean;
}

export interface UpdateCharacterRequest extends Partial<CreateCharacterRequest> {}

// Chat
export interface SendMessageRequest {
  content: string;
}

export interface UpdateProfileRequest {
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  username?: string;
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
