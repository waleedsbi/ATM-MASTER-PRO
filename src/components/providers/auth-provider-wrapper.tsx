'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { AppShell } from '@/components/layout/app-shell';
import { Toaster } from '@/components/ui/toaster';

export function AuthProviderWrapper({ children }: { children: React.ReactNode }) {
  // Always render AuthProvider - it handles SSR internally
  return (
    <AuthProvider>
      <div className="printable-area">
        <AppShell>{children}</AppShell>
      </div>
      <Toaster />
    </AuthProvider>
  );
}

