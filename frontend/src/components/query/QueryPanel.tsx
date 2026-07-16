'use client';

import { Send, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

import { DocumentFilterDropdown } from './DocumentFilterDropdown';

export type QueryMode = 'graph' | 'vector' | 'hybrid';

const MODES: { value: QueryMode; label: string }[] = [
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'graph', label: 'Graph' },
  { value: 'vector', label: 'Vector' },
];

interface QueryPanelProps {
  value: string;
  onChange: (v: string) => void;
  mode: QueryMode;
  onModeChange: (m: QueryMode) => void;
  onSubmit: () => void;
  loading?: boolean;
}

export function QueryPanel({
  value,
  onChange,
  mode,
  onModeChange,
  onSubmit,
  loading,
}: QueryPanelProps) {
  return (
    <div className="space-y-3">
      {/* Mode selector + document filter */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            Mode
          </span>
          <div className="inline-flex rounded-lg bg-bg-elevated p-0.5">
            {MODES.map((m) => (
              <button
                key={m.value}
                onClick={() => onModeChange(m.value)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-150',
                  mode === m.value
                    ? 'bg-accent-primary text-white shadow-sm'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface'
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
        <DocumentFilterDropdown />
      </div>

      {/* Search input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !loading && onSubmit()}
            placeholder="Ask anything about your documents..."
            className="h-11 pl-10 bg-bg-surface"
          />
        </div>
        <Button
          onClick={onSubmit}
          disabled={loading || !value.trim()}
          size="lg"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          <span className="hidden sm:inline">Ask</span>
        </Button>
      </div>
    </div>
  );
}
