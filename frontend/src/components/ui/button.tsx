import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-[6px] whitespace-nowrap rounded-[8px] text-[12px] font-semibold transition-all duration-150 ease-out focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-panel2 text-text border border-border hover:border-accent',
        accent: 'bg-accent text-accent-text border-none hover:brightness-[1.08] hover:-translate-y-[1px]',
        ghost: 'bg-panel2 text-text2 border border-border hover:text-text hover:border-accent',
        tool: 'h-[28px] w-[28px] rounded-[8px] bg-panel border border-border text-text2 hover:border-accent hover:text-accent p-0',
      },
      size: {
        default: 'px-[14px] py-[8px]',
        sm: 'px-[10px] py-[6px] text-[11px]',
        icon: 'h-[28px] w-[28px] p-0',
        none: '',
      },
    },
    defaultVariants: { 
      variant: 'default', 
      size: 'default' 
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    // If tool variant is selected, force size none so it uses tool's fixed dimensions
    const finalSize = variant === 'tool' ? 'none' : size;
    return (
      <button 
        ref={ref} 
        className={cn(buttonVariants({ variant, size: finalSize }), className)} 
        {...props} 
      />
    );
  }
);
Button.displayName = 'Button';
