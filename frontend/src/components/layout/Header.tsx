'use client';

import { Search } from 'lucide-react';
import { useCommandPalette } from '@/contexts/CommandPaletteContext';

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const { open } = useCommandPalette();

  return (
    <header className="flex h-14 items-center justify-between border-b border-border px-6">
      <h1 className="text-sm font-semibold">{title}</h1>

      <button
        onClick={open}
        className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Search…</span>
        <kbd className="ml-4 rounded bg-background px-1.5 py-0.5 text-[10px] font-mono border border-border">
          Ctrl K
        </kbd>
      </button>
    </header>
  );
}
