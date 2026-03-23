// AI Companions — Dark Cyberpunk Color System
// Derived from design-system MASTER.md + reference images

export const colors = {
  // Core backgrounds
  background: '#0A0A0F',
  surface: '#1A1A2E',
  surfaceElevated: '#16213E',
  surfaceLight: '#1F2937',
  surfaceBorder: 'rgba(124, 58, 237, 0.15)',

  // Primary brand
  primary: '#7C3AED',
  primaryLight: '#A78BFA',
  primaryDark: '#5B21B6',
  primaryMuted: 'rgba(124, 58, 237, 0.2)',
  primaryGlow: 'rgba(124, 58, 237, 0.4)',

  // Accent / Secondary
  accent: '#8B5CF6',
  accentPink: '#EC4899',
  accentCyan: '#06B6D4',
  accentGold: '#F59E0B',

  // CTA (Call to Action)
  cta: '#7C3AED',
  ctaGradientStart: '#7C3AED',
  ctaGradientEnd: '#A855F7',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  textDisabled: '#4B5563',

  // Semantic
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  online: '#10B981',

  // Chat
  userBubble: '#7C3AED',
  userBubbleGradientStart: '#7C3AED',
  userBubbleGradientEnd: '#9333EA',
  aiBubble: '#1F2937',
  aiBubbleBorder: 'rgba(124, 58, 237, 0.1)',

  // Tab bar
  tabBarBg: '#0D0D14',
  tabBarBorder: 'rgba(124, 58, 237, 0.15)',
  tabActive: '#7C3AED',
  tabInactive: '#6B7280',

  // Misc
  overlay: 'rgba(0, 0, 0, 0.6)',
  shimmer: '#2A2A3E',
  shimmerHighlight: '#3A3A4E',
  inputBg: '#1A1A2E',
  inputBorder: '#2D2D44',
  inputFocusBorder: '#7C3AED',
  cardBorder: 'rgba(255, 255, 255, 0.06)',
  divider: 'rgba(255, 255, 255, 0.08)',
} as const;

export type ColorKey = keyof typeof colors;
