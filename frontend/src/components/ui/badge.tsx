import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-[20px] px-[9px] py-[3px] text-[10px] font-semibold tracking-[0.02em]',
  {
    variants: {
      variant: {
        default: 'bg-panel2 text-text2 border border-border',
        accent: 'bg-accent-soft text-accent border-none',
        success: 'bg-[rgba(87,214,141,0.14)] text-entity-org border-none',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
