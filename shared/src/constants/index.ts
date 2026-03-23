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
