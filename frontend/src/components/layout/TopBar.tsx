'use client';

import { useDocumentsStore } from '@/store/documents';
import { Loader2 } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { usePathname } from 'next/navigation';

export function TopBar() {
  const activeJobs = useDocumentsStore((s) => s.activeJobs);
  const pathname = usePathname();

  // Simple mapping for page titles and subtitles
  let title = 'Query Graph';
  let subtitle = 'Ask questions against your knowledge base';
  
  if (pathname.includes('/voice-rag')) {
    title = 'Voice AI Interactive Session';
    subtitle = 'Talk naturally to explore your knowledge graph in real-time';
  } else if (pathname.includes('/documents')) {
    title = 'Document Library';
    subtitle = 'Manage and process your source documents';
  } else if (pathname.includes('/explore')) {
    title = 'Graph Explorer';
    subtitle = 'Visualize and navigate the entire knowledge network';
  } else if (pathname.includes('/compare')) {
    title = 'Compare Sources';
    subtitle = 'Evaluate vector vs graph retrieval side-by-side';
  } else if (pathname.includes('/status')) {
    title = 'Database Status';
    subtitle = 'System health and Neo4j connection metrics';
  } else if (pathname.includes('/settings')) {
    title = 'Settings';
    subtitle = 'Application preferences and API configuration';
  }

  return (
    <header className="flex shrink-0 items-center justify-between border-b border-border bg-panel px-[22px] py-[15px] z-30 relative">
      <div className="flex flex-col animate-fade-in" key={pathname}>
        <h1 className="font-display text-[15.5px] font-semibold tracking-[-0.01em] text-text">
          {title}
        </h1>
        <p className="mt-[1px] text-[11px] text-text3">
          {subtitle}
        </p>
      </div>
      
      <div className="flex items-center gap-3">
        {activeJobs > 0 && (
          <div className="flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-[11px] font-medium text-accent">
            <Loader2 className="h-[14px] w-[14px] animate-spin" />
            {activeJobs} processing
          </div>
        )}
        <ThemeToggle />
      </div>
    </header>
  );
}
