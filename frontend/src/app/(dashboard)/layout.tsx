'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { CommandPalette } from '@/components/command-palette/CommandPalette';
import { useAuth } from '@/contexts/AuthContext';
import { CommandPaletteContext } from '@/contexts/CommandPaletteContext';
import { SidebarProvider } from '@/contexts/SidebarContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [cmdOpen, setCmdOpen] = useState(false);
  const { isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  // Client-side guard (middleware handles the server-side redirect)
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Ctrl+K global shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Show nothing while verifying auth
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <CommandPaletteContext.Provider value={{ open: () => setCmdOpen(true) }}>
      <SidebarProvider>
        <div className="flex h-screen overflow-hidden bg-background">
          <Sidebar />
          <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
          <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
        </div>
      </SidebarProvider>
    </CommandPaletteContext.Provider>
  );
}
