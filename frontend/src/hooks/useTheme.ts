'use client';

import { useThemeStore } from '@/store/theme';

export function useTheme() {
  const { theme, toggleTheme, setTheme } = useThemeStore();
  return { theme, toggleTheme, setTheme };
}
