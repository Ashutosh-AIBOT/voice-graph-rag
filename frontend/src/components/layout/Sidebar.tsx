'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  FileText,
  Network,
  Scale,
  LayoutDashboard,
  LogOut,
  ChevronLeft,
  Menu,
  X,
  Mic2,
  Settings,
  Server
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { useShellStore } from '@/store/shell';
import { useModeController } from '@/state/modeController';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/voice-rag', label: 'Voice RAG', icon: Mic2 },
  { href: '/', label: 'Query', icon: LayoutDashboard, exact: true },
  { href: '/documents', label: 'Documents', icon: FileText },
  { href: '/explore', label: 'Explore', icon: Network },
  { href: '/compare', label: 'Compare', icon: Scale },
  { href: '/status', label: 'Neo4j Status', icon: Server },
  { href: '/settings', label: 'Settings', icon: Settings },
];

function NavLinks({ collapsed, isModeFaded, onNavigate }: { collapsed: boolean; isModeFaded: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  
  return (
    <nav className="flex flex-col gap-1">
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
              'group relative flex items-center transition-all',
              collapsed ? 'justify-center p-[9px]' : 'gap-3 px-[9px] py-[8px]',
              'rounded-[8px] text-[12.5px] font-medium',
              active
                ? 'bg-accent/14 text-accent'
                : 'text-text2 hover:bg-panel2 hover:text-text'
            )}
          >
            <Icon className={cn('shrink-0', collapsed ? 'h-[18px] w-[18px]' : 'h-4 w-4')} />
            
            {!collapsed && (
              <span className={cn(
                "truncate transition-opacity duration-100", 
                isModeFaded ? "opacity-0" : "opacity-100"
              )}>{item.label}</span>
            )}
            
            {/* Tooltip for collapsed state */}
            {collapsed && (
              <div className="pointer-events-none absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 rounded-[6px] border border-border bg-panel3 px-2 py-1 text-[11px] font-medium text-text opacity-0 shadow-lg transition-opacity group-hover:opacity-100 z-50 whitespace-nowrap">
                {item.label}
              </div>
            )}
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
  
  const isShellCollapsed = useShellStore((s) => s.isSidebarCollapsed);
  const toggleSidebar = useShellStore((s) => s.toggleSidebar);
  const isTalkUIExpanded = useModeController((s) => s.isTalkUIExpanded);
  
  const isModeCollapsed = useModeController((s) => 
    !isTalkUIExpanded && (s.activeBeats.has('sidebar_collapse') || s.mode === 'talk')
  );
  
  const isModeFaded = useModeController((s) => 
    !isTalkUIExpanded && (s.activeBeats.has('sidebar_labels_fade') || s.mode === 'talk')
  );
  
  const isCollapsed = isShellCollapsed || isModeCollapsed;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  if (!mounted) return null; // Prevent hydration mismatch with Zustand

  return (
    <>
      {/* Desktop sidebar */}
      <aside 
        className={cn(
          "hidden flex-col border-r border-border bg-panel md:flex transition-all duration-[280ms] ease-[cubic-bezier(0.4,0,0.2,1)] z-40 relative",
          isCollapsed ? "w-[60px]" : "w-[214px]"
        )}
      >
        {/* Brand Row */}
        <div className="flex h-14 shrink-0 items-center border-b border-border px-[14px]">
          <div className="flex items-center gap-[10px] w-full">
            <div className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-[7px] bg-accent text-accent-text">
              <Network className="h-4 w-4" />
            </div>
            {!isCollapsed && (
              <span className="font-display text-[14.5px] font-semibold tracking-[-0.01em] text-text whitespace-nowrap overflow-hidden">
                GraphRAG
              </span>
            )}
            
            <button 
              onClick={toggleSidebar}
              className={cn(
                "flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-[6px] bg-panel2 border border-border text-text2 transition-all hover:border-accent hover:text-accent ml-auto",
                isCollapsed && "rotate-180"
              )}
            >
              <ChevronLeft className="h-[14px] w-[14px]" />
            </button>
          </div>
        </div>
        
        {/* Navigation */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 scrollbar-thin">
          {!isCollapsed && (
            <div className={cn(
              "mb-2 px-2 text-[9.5px] font-semibold tracking-[0.09em] text-text3 uppercase transition-opacity duration-100",
              isModeFaded ? "opacity-0" : "opacity-100"
            )}>
              Main Menu
            </div>
          )}
          <NavLinks collapsed={isCollapsed} isModeFaded={isModeFaded} />
        </div>
        
        {/* Footer */}
        <div className="border-t border-border p-[14px]">
          <div className={cn(
            "flex items-center gap-2",
            isCollapsed && "justify-center"
          )}>
            <div className="flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full bg-accent font-display text-[10.5px] font-semibold text-accent-text">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            
            {!isCollapsed && (
              <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                <p className="truncate text-[11.5px] font-semibold text-text">{user?.username || 'User'}</p>
                <p className="truncate text-[10px] text-text3">{user?.email || 'admin@graphrag'}</p>
              </div>
            )}
          </div>
          
          {!isCollapsed && (
            <button
              onClick={handleLogout}
              className="mt-3 flex w-full items-center gap-2 rounded-[8px] px-2 py-[6px] text-[11.5px] font-medium text-text2 transition-colors hover:bg-panel2 hover:text-text"
            >
              <LogOut className="h-[14px] w-[14px]" /> Logout
            </button>
          )}
        </div>
      </aside>

      {/* Mobile top bar with hamburger */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-panel px-4 md:hidden">
        <div className="flex items-center gap-3">
          <button onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5 text-text" />
          </button>
          <div className="flex h-[24px] w-[24px] items-center justify-center rounded-[6px] bg-accent text-accent-text">
            <Network className="h-[14px] w-[14px]" />
          </div>
          <span className="font-display font-semibold text-text">GraphRAG</span>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-[260px] flex-col bg-panel shadow-2xl animate-slide-in">
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
              <div className="flex items-center gap-2">
                <div className="flex h-[26px] w-[26px] items-center justify-center rounded-[7px] bg-accent text-accent-text">
                  <Network className="h-4 w-4" />
                </div>
                <span className="font-display text-[14.5px] font-semibold tracking-[-0.01em] text-text">GraphRAG</span>
              </div>
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu" className="text-text2 hover:text-text">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <div className="mb-2 px-2 text-[9.5px] font-semibold tracking-[0.09em] text-text3 uppercase">
                Main Menu
              </div>
              <NavLinks collapsed={false} onNavigate={() => setMobileOpen(false)} />
            </div>
            <div className="border-t border-border p-[14px]">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-[8px] px-3 py-2 text-[12px] font-medium text-text2 hover:bg-panel2 hover:text-text"
              >
                <LogOut className="h-[14px] w-[14px]" /> Logout
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
