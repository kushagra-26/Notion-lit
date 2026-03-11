'use client';

import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BlockType } from '@/types';

interface Props {
  blockType: BlockType;
  visible: boolean;
  onDelete: () => void;
  onAddBelow: () => void;
}

const TYPE_LABEL: Partial<Record<BlockType, string>> = {
  text:      '¶',
  heading1:  'H1',
  heading2:  'H2',
  heading3:  'H3',
  checklist: '✓',
  code:      '</>',
  quote:     '"',
  divider:   '—',
};

export function BlockToolbar({ blockType, visible, onDelete, onAddBelow }: Props) {
  return (
    <div
      className={cn(
        'flex shrink-0 select-none items-center gap-0.5 pt-[3px] transition-opacity duration-100',
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none',
      )}
    >
      {/* Drag handle */}
      <button
        tabIndex={-1}
        className="cursor-grab rounded px-0.5 py-0.5 text-muted-foreground hover:bg-accent active:cursor-grabbing"
        title="Drag to reorder"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>

      {/* Add block below */}
      <button
        tabIndex={-1}
        onClick={onAddBelow}
        className="rounded px-0.5 py-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
        title="Add block below"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>

      {/* Type badge */}
      <span
        className="rounded px-1 py-0.5 font-mono text-[10px] text-muted-foreground hover:bg-accent cursor-default"
        title={`Block type: ${blockType}`}
      >
        {TYPE_LABEL[blockType] ?? blockType}
      </span>

      {/* Delete */}
      <button
        tabIndex={-1}
        onClick={onDelete}
        className="rounded px-0.5 py-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-red-500"
        title="Delete block"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
