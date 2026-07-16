'use client';

import { useAuthStore } from '@/store/auth';
import { useAuthReady } from '@/hooks/useAuthReady';
import { LandingPage } from '@/components/landing/LandingPage';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MainQueryView } from '@/components/dashboard/MainQueryView';

export default function RootPage() {
  const isAuthed = useAuthStore((s) => s.isAuthenticated);
  const ready = useAuthReady();

  if (!ready) return null;

  if (!isAuthed) return <LandingPage />;

  return (
    <DashboardLayout>
      <MainQueryView />
    </DashboardLayout>
  );
}
