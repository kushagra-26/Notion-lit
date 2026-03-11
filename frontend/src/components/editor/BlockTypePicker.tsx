'use client';

import { useEffect, useRef } from 'react';
import { Type, Heading1, Heading2, Heading3, CheckSquare, Code } from 'lucide-react';
import type { BlockType } from '@/types';

interface BlockTypeOption {
  type: BlockType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const BLOCK_TYPES: BlockTypeOption[] = [
  { type: 'text',     label: 'Text',      description: 'Plain paragraph',       icon: Type },
  { type: 'heading1', label: 'Heading 1', description: 'Large section heading',  icon: Heading1 },
  { type: 'heading2', label: 'Heading 2', description: 'Medium section heading', icon: Heading2 },
  { type: 'heading3', label: 'Heading 3', description: 'Small section heading',  icon: Heading3 },
  { type: 'checklist',label: 'Checklist', description: 'Trackable to-do item',   icon: CheckSquare },
  { type: 'code',     label: 'Code',      description: 'Code snippet',           icon: Code },
];

interface Props {
  onSelect: (type: BlockType) => void;
  onClose: () => void;
  style?: React.CSSProperties;
}

export function BlockTypePicker({ onSelect, onClose, style }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={style}
      className="absolute z-50 w-64 rounded-lg border border-border bg-card shadow-lg overflow-hidden"
    >
      <div className="border-b border-border px-3 py-2">
        <p className="text-xs font-medium text-muted-foreground">Turn into</p>
      </div>
      <ul className="p-1">
        {BLOCK_TYPES.map(({ type, label, description, icon: Icon }) => (
          <li key={type}>
            <button
              className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-accent transition-colors text-left"
              onMouseDown={(e) => {
                e.preventDefault(); // Don't blur the textarea
                onSelect(type);
              }}
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-border bg-background">
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div>
                <p className="text-sm font-medium leading-none">{label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
