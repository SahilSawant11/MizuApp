import { Platform } from 'react-native';

// Font family configuration
// After adding custom fonts, update these values
export const fonts = {
  regular: Platform.select({
    ios: 'Inter-Regular', // or 'System'
    android: 'Inter-Regular', // or 'Roboto'
  }),
  medium: Platform.select({
    ios: 'Inter-Medium',
    android: 'Inter-Medium',
  }),
  semibold: Platform.select({
    ios: 'Inter-SemiBold',
    android: 'Inter-SemiBold',
  }),
  bold: Platform.select({
    ios: 'Inter-Bold',
    android: 'Inter-Bold',
  }),
};

// Typography scale
export const typography = {
  h1: {
    fontFamily: fonts.bold,
    fontSize: 32,
    lineHeight: 40,
  },
  h2: {
    fontFamily: fonts.bold,
    fontSize: 28,
    lineHeight: 36,
  },
  h3: {
    fontFamily: fonts.bold,
    fontSize: 24,
    lineHeight: 32,
  },
  h4: {
    fontFamily: fonts.semibold,
    fontSize: 20,
    lineHeight: 28,
  },
  h5: {
    fontFamily: fonts.semibold,
    fontSize: 18,
    lineHeight: 24,
  },
  h6: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    lineHeight: 22,
  },
  body1: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  body2: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  caption: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  button: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    lineHeight: 20,
  },
  overline: {
    fontFamily: fonts.medium,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
  },
};