import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  wrapperClassName?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, wrapperClassName, children, ...props }, ref) => {
    return (
      <div className={cn('relative inline-flex items-center', wrapperClassName)}>
        <select
          ref={ref}
          className={cn(
            'appearance-none w-full bg-panel2 border border-border rounded-[8px] px-[12px] py-[8px] pr-[32px] text-[12px] text-text2 font-medium focus:outline-none focus:border-accent transition-colors',
            className
          )}
          {...props}
        >
          {children}
        </select>
        <div className="pointer-events-none absolute right-[10px] top-1/2 -translate-y-1/2 text-text3">
          <ChevronDown className="h-[14px] w-[14px]" />
        </div>
      </div>
    );
  }
);
Select.displayName = 'Select';
