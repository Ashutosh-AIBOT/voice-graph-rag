'use client';

import { useState } from 'react';
import { Network, Type, Layers, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

interface SourceToggleProps {
  method: string;
  entityCount: number;
  chunkCount: number;
  context?: string;
}

export function SourceToggle({ method, entityCount, chunkCount, context }: SourceToggleProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t border-border bg-bg-base px-4 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium',
              method === 'Graph' || method === 'GRAPH_ONLY'
                ? 'bg-accent-primary/10 text-accent-primary'
                : method === 'Vector' || method === 'VECTOR_ONLY'
                ? 'bg-accent-secondary/10 text-accent-secondary'
                : 'bg-accent-cyan/10 text-accent-cyan'
            )}
          >
            {method} used
          </span>
          {entityCount > 0 && (
            <span className="flex items-center gap-1 text-xs text-text-muted">
              <Network className="h-3.5 w-3.5" /> {entityCount} entities
            </span>
          )}
          {chunkCount > 0 && (
            <span className="flex items-center gap-1 text-xs text-text-muted">
              <Type className="h-3.5 w-3.5" /> {chunkCount} chunks
            </span>
          )}
        </div>
        {context && (
          <button
            onClick={() => setOpen((o) => !o)}
            className="inline-flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary transition-colors"
          >
            <Layers className="h-3.5 w-3.5" /> Context Preview
            <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
          </button>
        )}
      </div>
      {open && context && (
        <div className="mt-2 max-h-[300px] overflow-y-auto rounded-lg border border-border bg-bg-surface p-3 text-xs text-text-secondary scrollbar-thin">
          <div className="prose prose-invert max-w-none text-xs leading-relaxed text-text-secondary space-y-2">
            <ReactMarkdown>{context}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
