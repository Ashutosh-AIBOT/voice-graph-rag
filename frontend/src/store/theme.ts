import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ThemeType = 'dark' | 'gold';

interface ThemeState {
  theme: ThemeType;
  toggleTheme: () => void;
  setTheme: (theme: ThemeType) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'dark',
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'dark' ? 'gold' : 'dark' })),
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'graphrag-theme' }
  )
);
