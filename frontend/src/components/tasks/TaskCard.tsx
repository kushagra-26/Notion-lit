'use client';

import { useState } from 'react';
import { Calendar, MoreHorizontal, Pencil, Trash2, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Task, TaskPriority } from '@/types';

// ─── Priority config ─────────────────────

const PRIORITY: Record<TaskPriority, { label: string; dot: string; badge: string }> = {
  urgent: { label: 'Urgent', dot: 'bg-red-500',    badge: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400' },
  high:   { label: 'High',   dot: 'bg-orange-500', badge: 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400' },
  medium: { label: 'Medium', dot: 'bg-yellow-400', badge: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400' },
  low:    { label: 'Low',    dot: 'bg-blue-400',   badge: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400' },
};

// ─── Due date helpers ────────────────────

function dueDateState(dueDate?: string): 'overdue' | 'today' | 'soon' | 'normal' | null {
  if (!dueDate) return null;
  const today = new Date().toISOString().slice(0, 10);
  const soon  = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
  if (dueDate < today)  return 'overdue';
  if (dueDate === today) return 'today';
  if (dueDate <= soon)  return 'soon';
  return 'normal';
}

const DUE_STATE_STYLE: Record<string, string> = {
  overdue: 'text-red-500 font-medium',
  today:   'text-orange-500 font-medium',
  soon:    'text-yellow-600',
  normal:  'text-muted-foreground',
};

function formatDate(d: string): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(
    new Date(d + 'T00:00:00'),
  );
}

// ─── Props ───────────────────────────────

interface Props {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  isDragging?: boolean;
}

// ─── Component ───────────────────────────

export function TaskCard({ task, onEdit, onDelete, isDragging }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pri      = PRIORITY[task.priority];
  const dateState = dueDateState(task.dueDate);

  function handleDragStart(e: React.DragEvent) {
    e.dataTransfer.setData('taskId', task.id);
    e.dataTransfer.effectAllowed = 'move';
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={cn(
        'group relative rounded-lg border border-border bg-card p-3 shadow-sm transition-all cursor-grab active:cursor-grabbing active:shadow-md active:scale-[1.02]',
        isDragging && 'opacity-50 scale-95',
        task.status === 'done' && 'opacity-70',
      )}
    >
      {/* Drag indicator */}
      <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
      </div>

      {/* Header row */}
      <div className="flex items-start justify-between gap-2 pl-3">
        <div className="flex items-start gap-2 min-w-0">
          {/* Priority dot */}
          <span
            className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', pri.dot)}
            title={pri.label}
          />
          {/* Title */}
          <p
            className={cn(
              'text-sm font-medium leading-snug',
              task.status === 'done' && 'line-through text-muted-foreground',
            )}
          >
            {task.title}
          </p>
        </div>

        {/* Actions menu */}
        <div className="relative shrink-0">
          <button
            onClick={() => setMenuOpen((p) => !p)}
            className="rounded p-0.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-accent transition-all"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 top-full z-20 mt-1 w-36 rounded-lg border border-border bg-card shadow-lg"
              onMouseLeave={() => setMenuOpen(false)}
            >
              <div className="p-1">
                <button
                  onClick={() => { setMenuOpen(false); onEdit(task); }}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                <button
                  onClick={() => { setMenuOpen(false); onDelete(task.id); }}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {task.description && (
        <p className="mt-1.5 pl-5 text-xs text-muted-foreground line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Footer row */}
      <div className="mt-2.5 flex items-center justify-between pl-5">
        {/* Priority badge */}
        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', pri.badge)}>
          {pri.label}
        </span>

        {/* Due date */}
        {task.dueDate && dateState && (
          <div className={cn('flex items-center gap-1 text-xs', DUE_STATE_STYLE[dateState])}>
            <Calendar className="h-3 w-3" />
            {formatDate(task.dueDate)}
          </div>
        )}
      </div>
    </div>
  );
}
