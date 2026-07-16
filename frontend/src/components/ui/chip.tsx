import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const chipVariants = cva(
  'inline-flex items-center justify-center rounded-[20px] px-[10px] py-[4px] text-[10.5px] font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-panel2 text-text2 border border-border',
        dashed: 'bg-panel2 text-text3 border border-dashed border-border',
        suggest: 'bg-panel2 text-text2 border border-border hover:border-accent hover:text-accent cursor-pointer',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface ChipProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof chipVariants> {
  asChild?: boolean;
}

export const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(chipVariants({ variant, className }))}
        {...props}
      />
    );
  }
);
Chip.displayName = 'Chip';
