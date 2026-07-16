'use client';

import { usePathname } from 'next/navigation';
import { useDocumentsStore } from '@/store/documents';
import { Loader2, Search, Bell } from 'lucide-react';
import { navItems, advancedNavItems } from './Sidebar';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const allNavItems = [...navItems, ...advancedNavItems];

function titleForPath(pathname: string): string {
  const exactMatch = allNavItems.find((item) => 'exact' in item && item.exact && pathname === item.href);
  if (exactMatch) return exactMatch.label;

  const prefixMatch = allNavItems.find((item) => !('exact' in item) && pathname.startsWith(item.href));
  if (prefixMatch) return prefixMatch.label;

  return 'GraphRAG';
}

export function TopBar({ title }: { title?: string }) {
  const pathname = usePathname();
  const activeJobs = useDocumentsStore((s) => s.activeJobs);
  const resolvedTitle = title ?? titleForPath(pathname);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-bg-base px-4 lg:px-5">
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-semibold">{resolvedTitle}</h1>
      </div>

      <div className="flex items-center gap-2">
        {activeJobs > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-accent-cyan/10 px-3 py-1 text-xs font-medium text-accent-cyan">
            <Loader2 className="h-3 w-3 animate-spin" />
            {activeJobs} processing
          </div>
        )}

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setSearchOpen(!searchOpen)}
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
