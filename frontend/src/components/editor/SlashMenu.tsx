'use client';

import {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  forwardRef,
} from 'react';
import {
  Type, Heading1, Heading2, Heading3,
  CheckSquare, Code, Quote, Minus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BlockType } from '@/types';

// ─── Option registry ─────────────────────

interface SlashOption {
  type: BlockType;
  label: string;
  description: string;
  keywords: string[];
  icon: React.ComponentType<{ className?: string }>;
}

const OPTIONS: SlashOption[] = [
  {
    type: 'text',
    label: 'Text',
    description: 'Plain paragraph',
    keywords: ['text', 'paragraph', 'p'],
    icon: Type,
  },
  {
    type: 'heading1',
    label: 'Heading 1',
    description: 'Large section heading',
    keywords: ['heading', 'h1', 'title', 'large'],
    icon: Heading1,
  },
  {
    type: 'heading2',
    label: 'Heading 2',
    description: 'Medium heading',
    keywords: ['heading', 'h2', 'subtitle', 'medium'],
    icon: Heading2,
  },
  {
    type: 'heading3',
    label: 'Heading 3',
    description: 'Small heading',
    keywords: ['heading', 'h3', 'small'],
    icon: Heading3,
  },
  {
    type: 'checklist',
    label: 'Checklist',
    description: 'Trackable to-do item',
    keywords: ['checklist', 'todo', 'task', 'check'],
    icon: CheckSquare,
  },
  {
    type: 'code',
    label: 'Code',
    description: 'Code snippet with syntax',
    keywords: ['code', 'snippet', 'pre', 'block'],
    icon: Code,
  },
  {
    type: 'quote',
    label: 'Quote',
    description: 'Blockquote',
    keywords: ['quote', 'blockquote', 'cite'],
    icon: Quote,
  },
  {
    type: 'divider',
    label: 'Divider',
    description: 'Horizontal rule',
    keywords: ['divider', 'hr', 'rule', 'separator'],
    icon: Minus,
  },
];

function filterOptions(query: string): SlashOption[] {
  if (!query) return OPTIONS;
  const q = query.toLowerCase();
  return OPTIONS.filter(
    (o) =>
      o.label.toLowerCase().includes(q) ||
      o.keywords.some((k) => k.includes(q)),
  );
}

// ─── Imperative handle ───────────────────

export interface SlashMenuHandle {
  moveUp: () => void;
  moveDown: () => void;
  confirm: () => void;
}

// ─── Component ───────────────────────────

interface Props {
  query: string;
  onSelect: (type: BlockType) => void;
  onClose: () => void;
}

export const SlashMenu = forwardRef<SlashMenuHandle, Props>(
  function SlashMenu({ query, onSelect, onClose }, ref) {
    const [activeIdx, setActiveIdx] = useState(0);
    const listRef                   = useRef<HTMLUListElement>(null);
    const filtered                  = filterOptions(query);

    // Reset selection when query or filtered results change
    useEffect(() => {
      setActiveIdx(0);
    }, [query]);

    // Scroll active item into view
    useEffect(() => {
      const el = listRef.current?.children[activeIdx] as HTMLElement | undefined;
      el?.scrollIntoView({ block: 'nearest' });
    }, [activeIdx]);

    // Close on outside click
    useEffect(() => {
      const handler = (e: MouseEvent) => {
        if (listRef.current && !listRef.current.closest('[data-slash-menu]')?.contains(e.target as Node)) {
          onClose();
        }
      };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }, [onClose]);

    // Expose keyboard nav to parent (EditorBlock controls the textarea)
    useImperativeHandle(ref, () => ({
      moveUp:   () => setActiveIdx((i) => Math.max(0, i - 1)),
      moveDown: () => setActiveIdx((i) => Math.min(filtered.length - 1, i + 1)),
      confirm:  () => {
        const option = filtered[activeIdx];
        if (option) onSelect(option.type);
      },
    }), [filtered, activeIdx, onSelect]);

    if (filtered.length === 0) {
      return (
        <div
          data-slash-menu
          className="absolute z-50 w-64 rounded-lg border border-border bg-card shadow-xl overflow-hidden"
        >
          <p className="px-3 py-6 text-center text-xs text-muted-foreground">
            No matching blocks
          </p>
        </div>
      );
    }

    return (
      <div
        data-slash-menu
        className="absolute z-50 w-64 rounded-lg border border-border bg-card shadow-xl overflow-hidden"
      >
        {/* Header */}
        <div className="border-b border-border px-3 py-1.5">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Blocks
          </p>
        </div>

        {/* Options */}
        <ul ref={listRef} className="max-h-60 overflow-y-auto p-1">
          {filtered.map((option, i) => {
            const Icon = option.icon;
            return (
              <li key={option.type}>
                <button
                  className={cn(
                    'flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors',
                    i === activeIdx
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-accent/50',
                  )}
                  onMouseEnter={() => setActiveIdx(i)}
                  onMouseDown={(e) => {
                    e.preventDefault(); // prevent textarea blur
                    onSelect(option.type);
                  }}
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-border bg-background">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-none">{option.label}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>

        {/* Footer hint */}
        <div className="border-t border-border px-3 py-1.5">
          <p className="text-[10px] text-muted-foreground">
            ↑↓ Navigate · Enter Select · Esc Close
          </p>
        </div>
      </div>
    );
  },
);
