// ============================================================
// AI Companions — Constants
// ============================================================

export const CATEGORIES = [
  'Roleplay',
  'Romance',
  'Adventure',
  'Sci-Fi',
  'Fantasy',
  'Comedy',
  'Drama',
  'Horror',
  'Mystery',
  'Slice of Life',
  'Action',
  'Wellness',
  'Productivity',
  'Creativity',
  'Entertainment',
  'Education',
] as const;

export type Category = typeof CATEGORIES[number];

export const PERSONALITY_TRAITS = [
  'Shy', 'Confident', 'Playful', 'Serious', 'Mysterious',
  'Caring', 'Sarcastic', 'Flirty', 'Intellectual', 'Adventurous',
  'Cheerful', 'Melancholic', 'Rebellious', 'Gentle', 'Fierce',
  'Witty', 'Romantic', 'Cunning', 'Loyal', 'Independent',
  'Empathetic', 'Dominant', 'Submissive', 'Protective', 'Mischievous',
] as const;

export const COMMUNICATION_STYLES = [
  'Casual & Friendly',
  'Formal & Polite',
  'Flirty & Teasing',
  'Dark & Mysterious',
  'Energetic & Enthusiastic',
  'Calm & Soothing',
  'Sarcastic & Witty',
  'Poetic & Philosophical',
  'Direct & Bold',
  'Sweet & Affectionate',
] as const;

export const SPEAKING_TONES = [
  'Warm', 'Cold', 'Seductive', 'Childlike', 'Mature',
  'Robotic', 'Ethereal', 'Gruff', 'Melodic', 'Commanding',
] as const;

export const CHARACTER_STYLES = [
  { value: 'anime', label: 'Anime' },
  { value: 'realistic', label: 'Realistic' },
  { value: 'cartoon', label: 'Cartoon' },
  { value: '3d', label: '3D' },
  { value: 'pixel', label: 'Pixel' },
] as const;

export const CHARACTER_GENDERS = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'non-binary', label: 'Non-binary' },
  { value: 'other', label: 'Other' },
] as const;

// ---- Subscription Plans ----
export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    daily_messages: 25,
    features: [
      '25 messages per day',
      'Access to public characters',
      'Create up to 3 characters',
      'Basic AI responses',
    ],
  },
  starter: {
    name: 'Starter',
    price: 9.99,
    daily_messages: 100,
    features: [
      '100 messages per day',
      'Access to all characters',
      'Create up to 10 characters',
      'Faster AI responses',
      '100 coins per month',
    ],
  },
  pro: {
    name: 'Pro',
    price: 19.99,
    daily_messages: 500,
    features: [
      '500 messages per day',
      'Access to all characters',
      'Unlimited character creation',
      'Priority AI responses (GPT-4o)',
      '500 coins per month',
      'Memory system',
      'Image generation',
    ],
  },
  ultimate: {
    name: 'Ultimate',
    price: 39.99,
    daily_messages: -1, // unlimited
    features: [
      'Unlimited messages',
      'Access to all characters',
      'Unlimited character creation',
      'Best AI quality (GPT-4o)',
      '2000 coins per month',
      'Advanced memory',
      'Priority image generation',
      'Group chats',
      'Early access to features',
    ],
  },
} as const;

export type PlanKey = keyof typeof PLANS;

// ---- Limits ----
export const LIMITS = {
  maxMessageLength: 5000,
  maxCharacterNameLength: 50,
  maxCharacterDescriptionLength: 2000,
  maxBackstoryLength: 5000,
  maxBioLength: 500,
  contextWindowTokens: 4000,
  recentMessageCount: 30,
  memorySummaryTrigger: 20, // summarize every N messages
} as const;

// ---- AI Config ----
export const AI_MODELS = {
  fast: 'gpt-4o-mini',
  quality: 'gpt-4o',
} as const;

// ---- Derived Plan Limits (for server-side enforcement) ----
export const PLAN_LIMITS: Record<string, { daily_messages: number; max_characters: number }> = {
  free: { daily_messages: 25, max_characters: 3 },
  starter: { daily_messages: 100, max_characters: 10 },
  pro: { daily_messages: 500, max_characters: -1 },
  ultimate: { daily_messages: -1, max_characters: -1 },  // -1 = unlimited
};

// ---- Gifts ----
export interface GiftDefinition {
  id: string;
  name: string;
  icon: string;        // Ionicons name
  cost: number;        // coin cost
  category: 'romantic' | 'luxury' | 'fun' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  affinity: number;    // affinity points gained
}

export const GIFTS: GiftDefinition[] = [
  { id: 'rose', name: 'Rose', icon: 'flower-outline', cost: 10, category: 'romantic', rarity: 'common', affinity: 5 },
  { id: 'love_letter', name: 'Love Letter', icon: 'mail-outline', cost: 15, category: 'romantic', rarity: 'common', affinity: 8 },
  { id: 'chocolate', name: 'Chocolate Box', icon: 'gift-outline', cost: 20, category: 'fun', rarity: 'common', affinity: 10 },
  { id: 'teddy_bear', name: 'Teddy Bear', icon: 'heart-outline', cost: 30, category: 'fun', rarity: 'rare', affinity: 15 },
  { id: 'perfume', name: 'Perfume', icon: 'water-outline', cost: 40, category: 'luxury', rarity: 'rare', affinity: 20 },
  { id: 'star', name: 'Shooting Star', icon: 'star-outline', cost: 50, category: 'special', rarity: 'rare', affinity: 25 },
  { id: 'necklace', name: 'Necklace', icon: 'sparkles-outline', cost: 75, category: 'luxury', rarity: 'epic', affinity: 35 },
  { id: 'crown', name: 'Royal Crown', icon: 'trophy-outline', cost: 100, category: 'luxury', rarity: 'epic', affinity: 50 },
  { id: 'diamond_ring', name: 'Diamond Ring', icon: 'diamond-outline', cost: 150, category: 'romantic', rarity: 'legendary', affinity: 75 },
  { id: 'eternal_flame', name: 'Eternal Flame', icon: 'flame-outline', cost: 200, category: 'special', rarity: 'legendary', affinity: 100 },
] as const;

export const GIFT_COST_MAP: Record<string, GiftDefinition> = Object.fromEntries(
  GIFTS.map(g => [g.id, g])
);

export const RARITY_COLORS: Record<string, string> = {
  common: '#9CA3AF',
  rare: '#3B82F6',
  epic: '#A855F7',
  legendary: '#F59E0B',
};

// ---- Generation Costs ----
export const IMAGE_GEN_COST = 20;  // coins per image
export const TTS_COST = 5;         // coins per TTS message

// ---- Voice Config ----
export const VOICE_MODELS = [
  { value: 'alloy', label: 'Alloy' },
  { value: 'echo', label: 'Echo' },
  { value: 'fable', label: 'Fable' },
  { value: 'onyx', label: 'Onyx' },
  { value: 'nova', label: 'Nova' },
  { value: 'shimmer', label: 'Shimmer' },
] as const;

