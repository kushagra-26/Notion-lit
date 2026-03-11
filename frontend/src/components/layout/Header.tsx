'use client';

import { Search, Menu } from 'lucide-react';
import { useCommandPalette } from '@/contexts/CommandPaletteContext';
import { useSidebar } from '@/contexts/SidebarContext';

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const { open: openPalette } = useCommandPalette();
  const { toggle } = useSidebar();

  return (
    <header className="flex h-14 items-center justify-between border-b border-border px-4 md:px-6">
      <div className="flex items-center gap-3">
        {/* Hamburger — only visible on mobile */}
        <button
          onClick={toggle}
          className="flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors lg:hidden"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-sm font-semibold">{title}</h1>
      </div>

      <button
        onClick={openPalette}
        className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Search…</span>
        <kbd className="ml-1 hidden rounded bg-background px-1.5 py-0.5 text-[10px] font-mono border border-border sm:inline">
          Ctrl K
        </kbd>
      </button>
    </header>
  );
}
