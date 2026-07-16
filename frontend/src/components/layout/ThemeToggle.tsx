'use client';

import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '@/store/theme';
import { cn } from '@/lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className={cn(
        'flex items-center gap-[6px] rounded-[7px] bg-panel2 border border-border px-3 py-[6px] transition-all hover:border-accent hover:text-text',
        'text-[12px] font-medium text-text2',
        className
      )}
    >
      {isDark ? (
        <>
          <Sun className="h-[14px] w-[14px] text-accent" />
          Dark
        </>
      ) : (
        <>
          <Moon className="h-[14px] w-[14px] text-accent" />
          Gold
        </>
      )}
    </button>
  );
}
