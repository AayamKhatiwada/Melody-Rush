import { useMemo } from 'react';
import { useGameStore } from '../store';
import { DARK_COLORS, LIGHT_COLORS, makeGlobalStyles, ColorPalette } from '../constants/theme';

export function useColors(): ColorPalette {
  const theme = useGameStore(s => s.settings.theme);
  return theme === 'light' ? LIGHT_COLORS : DARK_COLORS;
}

export function useGlobalStyles() {
  const C = useColors();
  return useMemo(() => makeGlobalStyles(C), [C]);
}
