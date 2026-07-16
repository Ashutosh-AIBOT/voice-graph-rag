'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { useAuthReady } from '@/hooks/useAuthReady';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  const isAuthed = useAuthStore((s) => s.isAuthenticated);
  const router = useRouter();
  const isReady = useAuthReady();

  useEffect(() => {
    if (isReady && !isAuthed) {
      router.replace('/login');
    }
  }, [isReady, isAuthed, router]);

  if (!isReady || !isAuthed) return null;

  return <DashboardLayout>{children}</DashboardLayout>;
}
