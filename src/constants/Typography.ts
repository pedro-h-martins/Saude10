import { Colors } from './Colors';

export const Typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700',
  },
  h2: {
    fontSize: 24,
    fontWeight: '700' as const,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600' as const,
  },
  body: {
    fontSize: 14,
    fontWeight: '400' as const,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700' as const,
  },
} as const;

export const TypographyColors = (colors: typeof Colors) => ({
  h1: { color: colors.text },
  h2: { color: colors.text },
  h3: { color: colors.text },
  body: { color: colors.text },
  caption: { color: colors.textSecondary },
  statValue: { color: colors.primary },
});

