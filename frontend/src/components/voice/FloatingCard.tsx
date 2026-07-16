import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';
import tuning from '@/config/tuning.json';

type Position = 'left' | 'right' | 'bottom';

interface FloatingCardProps {
  position: Position;
  tabLabel: string;
  children: React.ReactNode;
  isActive: boolean; // Only shows when in talk mode
}

export function FloatingCard({ position, tabLabel, children, isActive }: FloatingCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isActive) {
      setIsOpen(false);
      return;
    }
  }, [isActive]);

  const handleInteraction = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (isOpen) {
      timeoutRef.current = setTimeout(() => {
        setIsOpen(false);
      }, tuning.floatingPanels.autoHideSeconds * 1000);
    }
  };

  useEffect(() => {
    handleInteraction();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isOpen]);

  if (!isActive) return null;

  const positionClasses = {
    left: 'left-0 top-1/2 -translate-y-1/2',
    right: 'right-0 top-[100px]',
    bottom: 'bottom-0 left-1/2 -translate-x-1/2 w-[600px] max-w-[90vw]',
  };

  const transformClasses = {
    left: isOpen ? 'translate-x-0' : '-translate-x-[calc(100%-24px)]',
    right: isOpen ? 'translate-x-0' : 'translate-x-[calc(100%-24px)]',
    bottom: isOpen ? 'translate-y-0' : 'translate-y-[calc(100%-24px)]',
  };

  return (
    <div 
      className={cn(
        "fixed z-50 flex transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] shadow-2xl bg-panel border border-border rounded-xl",
        positionClasses[position],
        transformClasses[position],
        position === 'bottom' ? 'flex-col rounded-b-none' : (position === 'right' ? 'flex-row-reverse rounded-r-none' : 'rounded-l-none')
      )}
      onMouseEnter={handleInteraction}
      onMouseMove={handleInteraction}
      onClick={handleInteraction}
    >
      {/* Pull Tab */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-center bg-panel2 border-border hover:bg-accent hover:text-accent-text hover:border-accent transition-colors",
          position === 'bottom' ? 'w-full h-[24px] border-b' : 'w-[24px] h-[100px]',
          position === 'left' && 'border-l',
          position === 'right' && 'border-r'
        )}
      >
        {position === 'left' && (isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)}
        {position === 'right' && (isOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />)}
        {position === 'bottom' && (isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />)}
        
        {position !== 'bottom' && (
          <span className="sr-only">{tabLabel}</span>
        )}
      </button>

      {/* Content */}
      <div className={cn(
        "bg-panel",
        position === 'bottom' ? 'p-3' : 'w-[320px] p-4'
      )}>
        {children}
      </div>
    </div>
  );
}
