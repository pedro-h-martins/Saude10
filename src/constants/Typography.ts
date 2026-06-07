import type { TextStyle } from 'react-native';

export interface TypographyPreset {
  fontSize: number;
  fontWeight: TextStyle['fontWeight'];
  lineHeight?: number;
  letterSpacing?: number;
}

export interface TypographyScale {
  headlineLarge: TypographyPreset;
  headlineMedium: TypographyPreset;
  titleLarge: TypographyPreset;
  titleMedium: TypographyPreset;
  titleSmall: TypographyPreset;
  bodyLarge: TypographyPreset;
  bodyMedium: TypographyPreset;
  bodySmall: TypographyPreset;
  labelLarge: TypographyPreset;
  labelMedium: TypographyPreset;
  labelSmall: TypographyPreset;
  statValue: TypographyPreset;
}

export const Typography: TypographyScale = {
  headlineLarge: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
  },
  headlineMedium: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 36,
  },
  titleLarge: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
  },
  titleMedium: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },
  titleSmall: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  bodyLarge: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  bodySmall: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
  labelLarge: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.1,
    lineHeight: 20,
  },
  labelMedium: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
    lineHeight: 16,
  },
  labelSmall: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.5,
    lineHeight: 14,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 36,
  },
} as const;

export const LegacyTypographyMap: Record<string, keyof TypographyScale> = {
  h1: 'headlineLarge',
  h2: 'titleLarge',
  h3: 'titleMedium',
  body: 'bodyMedium',
  caption: 'labelMedium',
  statValue: 'statValue',
};
