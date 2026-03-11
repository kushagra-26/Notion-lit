'use client';

import { Calendar, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Task, TaskPriority, TaskStatus } from '@/types';

// ─── Shared style maps ───────────────────

const PRIORITY_DOT: Record<TaskPriority, string> = {
  urgent: 'bg-red-500',
  high:   'bg-orange-500',
  medium: 'bg-yellow-400',
  low:    'bg-blue-400',
};

const PRIORITY_BADGE: Record<TaskPriority, string> = {
  urgent: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400',
  high:   'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400',
  medium: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400',
  low:    'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
};

const STATUS_BADGE: Record<TaskStatus, string> = {
  todo:        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  done:        'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  cancelled:   'bg-muted text-muted-foreground',
};

const STATUS_LABEL: Record<TaskStatus, string> = {
  todo:        'To Do',
  in_progress: 'In Progress',
  done:        'Done',
  cancelled:   'Cancelled',
};

function formatDate(d: string): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(
    new Date(d + 'T00:00:00'),
  );
}

function isOverdue(dueDate?: string): boolean {
  if (!dueDate) return false;
  return dueDate < new Date().toISOString().slice(0, 10);
}

// ─── Props ───────────────────────────────

interface Props {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
}

// ─── Component ───────────────────────────

export function TaskListView({ tasks, onEdit, onDelete, onStatusChange }: Props) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 py-20">
        <p className="text-sm font-medium">No tasks found</p>
        <p className="text-xs text-muted-foreground">Create a task to get started</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      {/* Table header */}
      <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 border-b border-border bg-muted/30 px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <span>Task</span>
        <span className="w-20 text-center">Priority</span>
        <span className="w-24 text-center">Status</span>
        <span className="w-24 text-center">Due</span>
        <span className="w-16 text-center">Actions</span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-border">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="group grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 px-4 py-3 hover:bg-muted/20 transition-colors"
          >
            {/* Title + description */}
            <div className="flex min-w-0 items-center gap-2.5">
              {/* Checkbox to toggle done */}
              <input
                type="checkbox"
                checked={task.status === 'done'}
                onChange={() =>
                  onStatusChange(task.id, task.status === 'done' ? 'todo' : 'done')
                }
                className="h-4 w-4 shrink-0 rounded border-border accent-primary cursor-pointer"
              />
              <span className={cn('h-2 w-2 shrink-0 rounded-full', PRIORITY_DOT[task.priority])} />
              <div className="min-w-0">
                <p
                  className={cn(
                    'truncate text-sm font-medium',
                    task.status === 'done' && 'line-through text-muted-foreground',
                  )}
                >
                  {task.title}
                </p>
                {task.description && (
                  <p className="truncate text-xs text-muted-foreground">{task.description}</p>
                )}
              </div>
            </div>

            {/* Priority */}
            <span
              className={cn(
                'w-20 rounded-full px-2 py-0.5 text-center text-[11px] font-medium',
                PRIORITY_BADGE[task.priority],
              )}
            >
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </span>

            {/* Status */}
            <span
              className={cn(
                'w-24 rounded-full px-2 py-0.5 text-center text-[11px] font-medium',
                STATUS_BADGE[task.status],
              )}
            >
              {STATUS_LABEL[task.status]}
            </span>

            {/* Due date */}
            <div className="w-24 text-center">
              {task.dueDate ? (
                <div
                  className={cn(
                    'flex items-center justify-center gap-1 text-xs',
                    isOverdue(task.dueDate) && task.status !== 'done'
                      ? 'text-red-500 font-medium'
                      : 'text-muted-foreground',
                  )}
                >
                  <Calendar className="h-3 w-3" />
                  {formatDate(task.dueDate)}
                </div>
              ) : (
                <span className="text-xs text-muted-foreground/50">—</span>
              )}
            </div>

            {/* Actions */}
            <div className="flex w-16 items-center justify-center gap-1">
              <button
                onClick={() => onEdit(task)}
                className="rounded p-1 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-accent transition-all"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => onDelete(task.id)}
                className="rounded p-1 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-red-500 transition-all"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
