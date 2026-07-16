import * as React from 'react';
import { cn } from '@/lib/utils';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'flex w-full rounded-[9px] border border-border bg-panel2 px-[12px] py-[9px] text-[12px] text-text transition-colors file:border-0 file:bg-transparent file:text-[12px] file:font-medium placeholder:text-text3 focus-visible:outline-none focus-visible:border-accent disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
);
Input.displayName = 'Input';
