import { Platform } from 'react-native';

export const typography = {
  family: {
    regular: Platform.select({ ios: 'Inter-Regular', android: 'Inter_400Regular', default: 'Inter' }),
    medium: Platform.select({ ios: 'Inter-Medium', android: 'Inter_500Medium', default: 'Inter' }),
    semiBold: Platform.select({ ios: 'Inter-SemiBold', android: 'Inter_600SemiBold', default: 'Inter' }),
    bold: Platform.select({ ios: 'Inter-Bold', android: 'Inter_700Bold', default: 'Inter' }),
  },
  size: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  lineHeight: {
    xs: 16,
    sm: 18,
    base: 22,
    md: 24,
    lg: 28,
    xl: 30,
    '2xl': 32,
    '3xl': 40,
    '4xl': 44,
  },
} as const;
