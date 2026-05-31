import { StyleSheet } from 'react-native';

// ─── Color palettes ───────────────────────────────────────────────────────────

export const DARK_COLORS = {
  background: '#0A0A0A',
  surface: '#151515',
  elevated: '#1F1F1F',

  text: '#FFFFFF',
  textSecondary: '#B8B8B8',
  textMuted: '#555555',

  primary: '#00C2FF',
  success: '#32FF7E',
  warning: '#FFB800',
  error: '#FF4D4D',
  purple: '#8B5CF6',

  tile: '#0D0D0D',
  tileBorder: '#00C2FF',

  perfect: '#32FF7E',
  great: '#00C2FF',
  good: '#FFD93D',
  miss: '#FF4D4D',

  transparent: 'transparent',
  overlay: 'rgba(0,0,0,0.85)',
  glassBackground: 'rgba(255,255,255,0.06)',
  glassBorder: 'rgba(255,255,255,0.1)',
  laneSeperator: '#1A1A1A',
  hitZone: 'rgba(0,194,255,0.08)',
  hitZoneBorder: 'rgba(0,194,255,0.4)',

  switchThumb: '#FFFFFF',
  cardShadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
};

export const LIGHT_COLORS = {
  background: '#EEF2F9',
  surface: '#FFFFFF',
  elevated: '#DDE3EF',

  text: '#0D1117',
  textSecondary: '#374151',
  textMuted: '#6B7280',

  primary: '#0088BB',
  success: '#16A34A',
  warning: '#D97706',
  error: '#DC2626',
  purple: '#7C3AED',

  tile: '#1A1A2E',
  tileBorder: '#0088BB',

  perfect: '#16A34A',
  great: '#0088BB',
  good: '#D97706',
  miss: '#DC2626',

  transparent: 'transparent',
  overlay: 'rgba(255,255,255,0.9)',
  glassBackground: 'rgba(255,255,255,0.85)',
  glassBorder: 'rgba(148,163,184,0.4)',
  laneSeperator: '#CBD5E1',
  hitZone: 'rgba(0,136,187,0.08)',
  hitZoneBorder: 'rgba(0,136,187,0.35)',

  switchThumb: '#FFFFFF',
  cardShadow: {
    shadowColor: '#8FA5C0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
};

// Default export kept for backward compat in non-themed code (game screen)
export const COLORS = DARK_COLORS;

export type ColorPalette = typeof DARK_COLORS;

// ─── Spacing / radius / typography / animation ────────────────────────────────

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const RADIUS = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 999,
};

export const FONT_SIZE = {
  displayXL: 48,
  displayLg: 36,
  h1: 28,
  h2: 24,
  h3: 20,
  bodyLg: 18,
  bodyMd: 16,
  bodySm: 14,
  caption: 12,
};

export const FONT_WEIGHT = {
  regular: '400' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const SHADOWS = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  neonBlue: {
    shadowColor: '#00C2FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
    elevation: 10,
  },
  neonGreen: {
    shadowColor: '#32FF7E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 10,
  },
  neonRed: {
    shadowColor: '#FF4D4D',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 10,
  },
  neonGold: {
    shadowColor: '#FFD93D',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 18,
    elevation: 12,
  },
  neonPurple: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 18,
    elevation: 12,
  },
};

export const ANIMATION = {
  instant: 100,
  fast: 200,
  medium: 350,
  slow: 600,
};

// ─── Dynamic global styles ────────────────────────────────────────────────────

export function makeGlobalStyles(C: ColorPalette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: C.background,
    },
    glassCard: {
      backgroundColor: C.glassBackground,
      borderWidth: 1,
      borderColor: C.glassBorder,
      borderRadius: RADIUS.lg,
      ...C.cardShadow,
    },
    primaryButton: {
      backgroundColor: C.primary,
      height: 56,
      borderRadius: RADIUS.lg,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingHorizontal: SPACING.xl,
      ...SHADOWS.neonBlue,
    },
    secondaryButton: {
      backgroundColor: C.transparent,
      height: 56,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: C.glassBorder,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingHorizontal: SPACING.xl,
    },
    buttonText: {
      color: C.text,
      fontSize: FONT_SIZE.bodyLg,
      fontWeight: FONT_WEIGHT.bold,
      letterSpacing: 0.5,
    },
    title: {
      fontSize: FONT_SIZE.displayLg,
      fontWeight: FONT_WEIGHT.bold,
      color: C.text,
      letterSpacing: 2,
    },
    label: {
      fontSize: FONT_SIZE.bodySm,
      fontWeight: FONT_WEIGHT.regular,
      color: C.textSecondary,
      letterSpacing: 1,
      textTransform: 'uppercase' as const,
    },
  });
}

// Static fallback (dark) — used by GameScreen which is always dark
export const globalStyles = makeGlobalStyles(DARK_COLORS);
