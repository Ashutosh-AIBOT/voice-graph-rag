'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  FileText,
  Network,
  Scale,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  Mic2,
  GitBranch,
  Users,
  Terminal,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { ThemeToggle } from './ThemeToggle';
import { cn } from '@/lib/utils';

export const navItems = [
  { href: '/voice-rag', label: 'Voice RAG', icon: Mic2 },
  { href: '/', label: 'Query', icon: LayoutDashboard, exact: true },
  { href: '/documents', label: 'Documents', icon: FileText },
  { href: '/explore', label: 'Explore', icon: Network },
  { href: '/compare', label: 'Compare', icon: Scale },
];

export const advancedNavItems = [
  { href: '/multihop', label: 'Multi-Hop', icon: GitBranch },
  { href: '/communities', label: 'Communities', icon: Users },
  { href: '/cypher', label: 'Cypher', icon: Terminal },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-0.5">
      {navItems.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
              active
                ? 'bg-accent-primary/10 text-accent-primary'
                : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
            )}
          >
            {active && (
              <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r-full bg-accent-primary" />
            )}
            <Icon className={cn(
              'h-4 w-4 shrink-0 transition-colors',
              active ? 'text-accent-primary' : 'text-text-muted group-hover:text-text-secondary'
            )} />
            <span>{item.label}</span>
          </Link>
        );
      })}

      {/* Advanced section */}
      <div className="mt-4 mb-2 px-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-text-quaternary">Advanced</p>
      </div>
      {advancedNavItems.map((item) => {
        const active = pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
              active
                ? 'bg-accent-primary/10 text-accent-primary'
                : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
            )}
          >
            {active && (
              <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r-full bg-accent-primary" />
            )}
            <Icon className={cn(
              'h-4 w-4 shrink-0 transition-colors',
              active ? 'text-accent-primary' : 'text-text-muted group-hover:text-text-secondary'
            )} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();
  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-bg-sidebar md:flex">
        {/* Brand */}
        <div className="flex h-14 items-center gap-2.5 border-b border-border px-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-accent-primary to-accent-cyan text-white shadow-sm">
            <Network className="h-3.5 w-3.5" />
          </div>
          <span className="text-base font-semibold tracking-tight">GraphRAG</span>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
          <NavLinks />
        </div>

        {/* User section */}
        <div className="border-t border-border p-2">
          <div className="flex items-center gap-2.5 rounded-lg p-2 transition-colors hover:bg-bg-elevated">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent-cyan/20 to-accent-primary/20 text-xs font-semibold text-accent-cyan">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user?.username || 'User'}</p>
              <p className="truncate text-xs text-text-muted">{user?.email || ''}</p>
            </div>
          </div>
          <div className="mt-1 flex items-center justify-between px-1">
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-text-muted transition-colors hover:bg-error/10 hover:text-error"
            >
              <LogOut className="h-3.5 w-3.5" /> Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-border bg-bg-sidebar px-4 py-2.5 md:hidden">
        <div className="flex items-center gap-2">
          <button onClick={() => setMobileOpen(true)} aria-label="Open menu" className="p-1.5 rounded-lg hover:bg-bg-elevated transition-colors">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-accent-primary to-accent-cyan text-white">
              <Network className="h-3 w-3" />
            </div>
            <span className="text-sm font-semibold">GraphRAG</span>
          </div>
        </div>
        <ThemeToggle />
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-overlay backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col bg-bg-sidebar border-r border-border animate-slide-in">
            <div className="flex h-14 items-center justify-between border-b border-border px-4">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-accent-primary to-accent-cyan text-white">
                  <Network className="h-3.5 w-3.5" />
                </div>
                <span className="text-base font-semibold">GraphRAG</span>
              </div>
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu" className="p-1.5 rounded-lg hover:bg-bg-elevated transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              <NavLinks onNavigate={() => setMobileOpen(false)} />
            </div>
            <div className="border-t border-border p-3">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-error/10 hover:text-error"
              >
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
