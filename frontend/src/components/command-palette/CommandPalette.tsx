'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  CheckSquare,
  Columns,
  BookOpen,
  Flame,
  TrendingUp,
  Newspaper,
  Github,
  Plus,
  FilePlus,
  Search,
} from 'lucide-react';
import { pagesApi, searchApi } from '@/lib/api';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  type: 'page' | 'task';
  title: string;
  subtitle?: string;
  url: string;
}

interface Command {
  id: string;
  label: string;
  description?: string;
  group: 'create' | 'navigate';
  icon: React.ComponentType<{ className?: string }>;
  action: () => void | Promise<void>;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery]         = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const [loading, setLoading]     = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const listRef = useRef<HTMLUListElement>(null);
  const router  = useRouter();

  function run(cmd: Command) {
    const result = cmd.action();
    if (result instanceof Promise) {
      setLoading(cmd.id);
      result.finally(() => { setLoading(null); onClose(); });
    } else {
      onClose();
    }
  }

  const commands: Command[] = [
    // ─── Create ───────────────────────────
    {
      id: 'new-note',
      label: 'New Note',
      description: 'Create a new page',
      group: 'create',
      icon: FilePlus,
      action: async () => {
        const res  = await pagesApi.create({ title: 'Untitled' });
        router.push(`/notes/${res.data.id}`);
      },
    },
    {
      id: 'new-task',
      label: 'New Task',
      description: 'Open Tasks and create a task',
      group: 'create',
      icon: Plus,
      action: () => router.push('/tasks'),
    },
    // ─── Navigate ─────────────────────────
    {
      id: 'nav-dashboard',
      label: 'Go to Dashboard',
      group: 'navigate',
      icon: LayoutDashboard,
      action: () => router.push('/'),
    },
    {
      id: 'nav-notes',
      label: 'Go to Notes',
      group: 'navigate',
      icon: FileText,
      action: () => router.push('/notes'),
    },
    {
      id: 'nav-tasks',
      label: 'Go to Tasks',
      group: 'navigate',
      icon: CheckSquare,
      action: () => router.push('/tasks'),
    },
    {
      id: 'nav-kanban',
      label: 'Go to Kanban',
      group: 'navigate',
      icon: Columns,
      action: () => router.push('/kanban'),
    },
    {
      id: 'nav-journal',
      label: 'Go to Journal',
      group: 'navigate',
      icon: BookOpen,
      action: () => router.push('/journal'),
    },
    {
      id: 'nav-habits',
      label: 'Go to Habits',
      group: 'navigate',
      icon: Flame,
      action: () => router.push('/habits'),
    },
    {
      id: 'nav-learning',
      label: 'Go to Learning',
      group: 'navigate',
      icon: TrendingUp,
      action: () => router.push('/learning'),
    },
    {
      id: 'nav-news',
      label: 'Go to Tech News',
      group: 'navigate',
      icon: Newspaper,
      action: () => router.push('/news'),
    },
    {
      id: 'nav-github',
      label: 'Go to GitHub',
      group: 'navigate',
      icon: Github,
      action: () => router.push('/github'),
    },
  ];

  const filtered = query.trim()
    ? commands.filter(
        (c) =>
          c.label.toLowerCase().includes(query.toLowerCase()) ||
          c.description?.toLowerCase().includes(query.toLowerCase()),
      )
    : commands;

  // Group filtered results
  const createCmds   = filtered.filter((c) => c.group === 'create');
  const navigateCmds = filtered.filter((c) => c.group === 'navigate');

  // Flat list for keyboard nav indexing
  const flat = [...createCmds, ...navigateCmds];

  // Reset state when palette opens/closes
  useEffect(() => {
    if (!open) { setQuery(''); setActiveIdx(0); setLoading(null); setSearchResults([]); }
  }, [open]);

  // Debounced search when query changes
  useEffect(() => {
    setActiveIdx(0);
    clearTimeout(searchDebounce.current);
    if (query.trim().length >= 2) {
      searchDebounce.current = setTimeout(async () => {
        try {
          const res = await searchApi.search(query.trim());
          setSearchResults(res.data);
        } catch {
          setSearchResults([]);
        }
      }, 300);
    } else {
      setSearchResults([]);
    }
  }, [query]);

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>('[data-active="true"]');
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx]);

  // All navigable items: search results (if any) + commands
  const allItems: Array<{ id: string; label: string; action: () => void }> = [
    ...searchResults.map((r) => ({
      id: `sr-${r.id}`,
      label: r.title,
      action: () => { router.push(r.url); onClose(); },
    })),
    ...flat.map((c) => ({ id: c.id, label: c.label, action: () => run(c) })),
  ];

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, allItems.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, 0));
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        allItems[activeIdx]?.action();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, allItems, activeIdx, onClose]);

  if (!open) return null;

  function renderGroup(label: string, cmds: Command[], offset: number) {
    if (cmds.length === 0) return null;
    return (
      <>
        {label && (
          <li className="px-3 pt-2 pb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {label}
            </span>
          </li>
        )}
        {cmds.map((cmd, i) => {
          const globalIdx = offset + i;
          const Icon = cmd.icon;
          const isActive = activeIdx === globalIdx;
          const isLoading = loading === cmd.id;
          return (
            <li key={cmd.id}>
              <button
                data-active={isActive}
                onMouseEnter={() => setActiveIdx(globalIdx)}
                onClick={() => run(cmd)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                  isActive ? 'bg-accent text-accent-foreground' : 'text-foreground',
                )}
              >
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 text-left">{cmd.label}</span>
                {cmd.description && (
                  <span className="text-xs text-muted-foreground">{cmd.description}</span>
                )}
                {isLoading && (
                  <span className="h-3 w-3 animate-spin rounded-full border border-border border-t-foreground" />
                )}
              </button>
            </li>
          );
        })}
      </>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Palette */}
      <div
        className="relative w-full max-w-xl rounded-xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          )}
        </div>

        {/* Results */}
        <ul ref={listRef} className="max-h-80 overflow-y-auto p-2">
          {/* Real search results */}
          {searchResults.length > 0 && (
            <>
              <li className="px-3 pt-2 pb-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Results</span>
              </li>
              {searchResults.map((r, i) => {
                const isActive = activeIdx === i;
                return (
                  <li key={`sr-${r.id}`}>
                    <button
                      data-active={isActive}
                      onMouseEnter={() => setActiveIdx(i)}
                      onClick={() => { router.push(r.url); onClose(); }}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                        isActive ? 'bg-accent text-accent-foreground' : 'text-foreground',
                      )}
                    >
                      {r.type === 'page' ? (
                        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <CheckSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                      <span className="flex-1 text-left truncate">{r.title}</span>
                      <span className="text-xs text-muted-foreground capitalize">{r.type}</span>
                    </button>
                  </li>
                );
              })}
              <li className="px-3 pt-2 pb-1 border-t border-border mt-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Commands</span>
              </li>
            </>
          )}

          {/* Commands */}
          {flat.length === 0 && searchResults.length === 0 ? (
            <li className="px-3 py-8 text-center text-sm text-muted-foreground">
              No results for &quot;{query}&quot;
            </li>
          ) : (
            <>
              {renderGroup(searchResults.length > 0 ? '' : 'Create', createCmds, searchResults.length)}
              {renderGroup(searchResults.length > 0 ? '' : 'Navigate', navigateCmds, searchResults.length + createCmds.length)}
            </>
          )}
        </ul>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-4 py-2">
          <span className="text-[10px] text-muted-foreground">
            ↑↓ Navigate · Enter Select · Esc Close
          </span>
          <span className="text-[10px] text-muted-foreground">Ctrl K</span>
        </div>
      </div>
    </div>
  );
}
