'use client';

import ReactMarkdown from 'react-markdown';
import { Quote, Bot, CheckCircle } from 'lucide-react';

interface Citation {
  doc: string;
  page?: string;
}

interface AnswerCardProps {
  answer: string;
  confidence?: number;
  method?: string;
  citations?: Citation[];
  loading?: boolean;
}

export function AnswerCard({ answer, confidence, method, citations, loading }: AnswerCardProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-bg-surface p-5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bot className="h-5 w-5 text-accent-cyan" />
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-accent-cyan animate-pulse" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">Thinking...</p>
            <p className="text-xs text-text-muted">Finding relevant entities and relationships</p>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          {[85, 70, 55].map((w, i) => (
            <div key={i} className="h-3 rounded-lg skeleton" style={{ width: `${w}%` }} />
          ))}
        </div>
      </div>
    );
  }
  if (!answer) return null;

  return (
    <div className="rounded-xl border border-border bg-bg-surface p-5 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {method && (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-accent-primary/10 px-2.5 py-1 text-xs font-medium text-accent-primary">
            {method}
          </span>
        )}
        {confidence !== undefined && (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
            <CheckCircle className="h-3 w-3" />
            {Math.round(confidence * 100)}% confidence
          </span>
        )}
      </div>

      <div className="prose-invert max-w-none text-sm leading-relaxed text-text-primary">
        <ReactMarkdown>{answer}</ReactMarkdown>
      </div>

      {citations && citations.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
          <Quote className="h-3.5 w-3.5 text-text-muted" />
          <span className="text-xs font-medium text-text-muted">Sources:</span>
          {citations.map((c, i) => (
            <span
              key={i}
              className="rounded-md bg-bg-elevated px-2 py-0.5 text-xs font-medium text-text-secondary"
            >
              [{i + 1}] {c.doc} {c.page}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
