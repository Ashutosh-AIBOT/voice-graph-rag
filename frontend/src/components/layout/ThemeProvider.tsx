'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/store/theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((s) => s.theme);
  
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    window.dispatchEvent(new CustomEvent('graphrag:theme', { detail: { theme } }));
  }, [theme]);
  
  return <>{children}</>;
}
