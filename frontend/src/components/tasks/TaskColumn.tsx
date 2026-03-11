'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { TaskCard } from './TaskCard';
import { cn } from '@/lib/utils';
import type { Task, TaskStatus } from '@/types';

interface ColumnConfig {
  status: TaskStatus;
  label: string;
  accent: string;        // border-top color
  countBg: string;       // badge background
}

export const COLUMNS: ColumnConfig[] = [
  { status: 'todo',        label: 'To Do',       accent: 'bg-slate-400',  countBg: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
  { status: 'in_progress', label: 'In Progress', accent: 'bg-blue-500',   countBg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  { status: 'done',        label: 'Done',        accent: 'bg-green-500',  countBg: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
];

interface Props {
  column: ColumnConfig;
  tasks: Task[];
  draggingId: string | null;
  onDrop: (taskId: string, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onAddTask: (status: TaskStatus) => void;
}

export function TaskColumn({
  column,
  tasks,
  draggingId,
  onDrop,
  onEdit,
  onDelete,
  onAddTask,
}: Props) {
  const [isDragOver, setIsDragOver] = useState(false);

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    // Only clear if leaving the column container itself (not a child)
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) onDrop(taskId, column.status);
  }

  return (
    <div
      className="flex min-w-0 flex-1 flex-col"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn('h-2.5 w-2.5 rounded-full', column.accent)} />
          <span className="text-sm font-semibold">{column.label}</span>
          <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', column.countBg)}>
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onAddTask(column.status)}
          className="rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          title={`Add to ${column.label}`}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Drop zone */}
      <div
        className={cn(
          'flex flex-1 flex-col gap-2 rounded-xl p-2 transition-colors min-h-[200px]',
          isDragOver
            ? 'bg-accent/60 ring-2 ring-primary/30 ring-dashed'
            : 'bg-muted/40',
        )}
      >
        {tasks.length === 0 && !isDragOver && (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-xs text-muted-foreground">Drop tasks here</p>
          </div>
        )}

        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            isDragging={draggingId === task.id}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}

        {/* Drag-over placeholder */}
        {isDragOver && (
          <div className="h-16 rounded-lg border-2 border-dashed border-primary/40 bg-primary/5" />
        )}
      </div>
    </div>
  );
}
