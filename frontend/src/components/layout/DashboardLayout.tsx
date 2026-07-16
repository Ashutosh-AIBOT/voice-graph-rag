import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useDocumentPolling } from '@/hooks/useDocumentPolling';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  useDocumentPolling(); // Poll documents globally to keep Query page select boxes in sync
  
  return (
    <div className="flex h-screen overflow-hidden bg-bg2">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col relative">
        <TopBar />
        <main className="min-h-0 flex-1 overflow-auto relative z-10">{children}</main>
      </div>
    </div>
  );
}
