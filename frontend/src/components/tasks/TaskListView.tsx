'use client';

import { useState } from 'react';
import { Calendar, Pencil, Trash2, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Task, TaskPriority, TaskStatus } from '@/types';

// ─── Style maps ──────────────────────────

const PRIORITY_DOT: Record<TaskPriority, string> = {
  urgent: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-400',
  low: 'bg-blue-400',
};

const STATUS_STYLES: Record<TaskStatus, { badge: string; label: string; dot: string }> = {
  todo: { badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300', label: 'Pending', dot: 'bg-slate-400' },
  in_progress: { badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', label: 'In Progress', dot: 'bg-blue-500' },
  done: { badge: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300', label: 'Done', dot: 'bg-green-500' },
  cancelled: { badge: 'bg-muted text-muted-foreground', label: 'Cancelled', dot: 'bg-muted-foreground' },
};

const STATUS_CYCLE: Record<TaskStatus, TaskStatus> = {
  todo: 'in_progress',
  in_progress: 'done',
  done: 'todo',
  cancelled: 'todo',
};

function formatDate(d?: string): string {
  if (!d) return '—';

  const date = new Date(d);

  if (isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function isOverdue(dueDate?: string): boolean {
  if (!dueDate) return false;
  return dueDate < new Date().toISOString().slice(0, 10);
}

// ─── Status dropdown ─────────────────────

function StatusDropdown({
  status,
  onChange,
}: {
  status: TaskStatus;
  onChange: (s: TaskStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  const s = STATUS_STYLES[status];
  const options: TaskStatus[] = ['todo', 'in_progress', 'done', 'cancelled'];

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className={cn(
          'flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors',
          s.badge,
        )}
      >
        <span className={cn('h-1.5 w-1.5 rounded-full', s.dot)} />
        {s.label}
        <ChevronDown className="h-3 w-3" />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-36 rounded-lg border border-border bg-popover shadow-lg">
            {options.map((opt) => {
              const os = STATUS_STYLES[opt];
              return (
                <button
                  key={opt}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(opt);
                    setOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-accent transition-colors',
                    opt === status && 'bg-accent',
                  )}
                >
                  <span className={cn('h-2 w-2 rounded-full', os.dot)} />
                  {os.label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Section component ────────────────────

interface SectionProps {
  title: string;
  count: number;
  dotColor: string;
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
}

function TaskSection({ title, count, dotColor, tasks, onEdit, onDelete, onStatusChange }: SectionProps) {
  const [collapsed, setCollapsed] = useState(false);

  if (tasks.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      {/* Section header */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="flex w-full items-center gap-2 border-b border-border bg-muted/30 px-4 py-2.5 text-left hover:bg-muted/50 transition-colors"
      >
        <span className={cn('h-2 w-2 rounded-full', dotColor)} />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</span>
        <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">{count}</span>
        <ChevronDown className={cn('ml-auto h-3.5 w-3.5 text-muted-foreground transition-transform', collapsed && '-rotate-90')} />
      </button>

      {!collapsed && (
        <div className="divide-y divide-border">
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onEdit={onEdit}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Task row ────────────────────────────

function TaskRow({
  task,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
}) {
  const isDone = task.status === 'done';

  return (
    <div className="group flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors">
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={isDone}
        onChange={() => onStatusChange(task.id, isDone ? 'todo' : 'done')}
        className="h-4 w-4 shrink-0 rounded border-border accent-primary cursor-pointer"
      />

      {/* Priority dot */}
      <span className={cn('h-2 w-2 shrink-0 rounded-full', PRIORITY_DOT[task.priority])} />

      {/* Title + meta */}
      <div className="min-w-0 flex-1">
        <p className={cn(
          'text-sm font-medium leading-snug',
          isDone && 'line-through text-muted-foreground',
        )}>
          {task.title}
        </p>
        {task.description && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{task.description}</p>
        )}
        <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground/70">
          <span>Created {formatDate(task.createdAt)}</span>
          {isDone && task.completedAt && (
            <span className="text-green-600 dark:text-green-400">
              ✓ Completed {formatDate(task.completedAt)}
            </span>
          )}
        </div>
      </div>

      {/* Due date */}
      {task.dueDate && (
        <div className={cn(
          'flex items-center gap-1 text-xs shrink-0',
          isOverdue(task.dueDate) && !isDone ? 'text-red-500 font-medium' : 'text-muted-foreground',
        )}>
          <Calendar className="h-3 w-3" />
          {formatDate(task.dueDate)}
        </div>
      )}

      {/* Status dropdown */}
      <StatusDropdown
        status={task.status}
        onChange={(s) => onStatusChange(task.id, s)}
      />

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(task)}
          className="rounded p-1 text-muted-foreground hover:bg-accent transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-red-500 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────

interface Props {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
}

export function TaskListView({ tasks, onEdit, onDelete, onStatusChange }: Props) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-20">
        <p className="text-sm font-medium">No tasks found</p>
        <p className="text-xs text-muted-foreground">Create a task to get started</p>
      </div>
    );
  }

  const pending = tasks.filter((t) => t.status === 'todo');
  const inProgress = tasks.filter((t) => t.status === 'in_progress');
  const done = tasks.filter((t) => t.status === 'done');
  const cancelled = tasks.filter((t) => t.status === 'cancelled');

  return (
    <div className="space-y-3">
      <TaskSection
        title="In Progress"
        count={inProgress.length}
        dotColor="bg-blue-500"
        tasks={inProgress}
        onEdit={onEdit}
        onDelete={onDelete}
        onStatusChange={onStatusChange}
      />
      <TaskSection
        title="Pending"
        count={pending.length}
        dotColor="bg-slate-400"
        tasks={pending}
        onEdit={onEdit}
        onDelete={onDelete}
        onStatusChange={onStatusChange}
      />
      <TaskSection
        title="Done"
        count={done.length}
        dotColor="bg-green-500"
        tasks={done}
        onEdit={onEdit}
        onDelete={onDelete}
        onStatusChange={onStatusChange}
      />
      {cancelled.length > 0 && (
        <TaskSection
          title="Cancelled"
          count={cancelled.length}
          dotColor="bg-muted-foreground"
          tasks={cancelled}
          onEdit={onEdit}
          onDelete={onDelete}
          onStatusChange={onStatusChange}
        />
      )}
    </div>
  );
}
