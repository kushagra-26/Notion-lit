'use client';

import { useState } from 'react';
import { Plus, LayoutGrid, List, AlertCircle } from 'lucide-react';
import { KanbanBoard } from '@/components/tasks/KanbanBoard';
import { TaskListView } from '@/components/tasks/TaskListView';
import { TaskModal, type TaskFormData } from '@/components/tasks/TaskModal';
import { TaskFilters } from '@/components/tasks/TaskFilters';
import { useTasks, type TaskFilters as TFilters } from '@/hooks/useTasks';
import { Header } from '@/components/layout/Header';
import { cn } from '@/lib/utils';
import type { Task, TaskStatus } from '@/types';

type View = 'kanban' | 'list';

export default function TasksPage() {
  const [view, setView]               = useState<View>('kanban');
  const [filters, setFilters]         = useState<TFilters>({});
  const [modalOpen, setModalOpen]     = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Pre-set status when adding from a specific kanban column
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>('todo');

  const { tasks, isLoading, error, createTask, updateTask, deleteTask, moveTask } =
    useTasks(filters);

  // ─── Handlers ─────────────────────────

  function openCreate(status: TaskStatus = 'todo') {
    setDefaultStatus(status);
    setEditingTask(null);
    setModalOpen(true);
  }

  function openEdit(task: Task) {
    setEditingTask(task);
    setModalOpen(true);
  }

  async function handleSubmit(data: TaskFormData) {
    if (editingTask) {
      await updateTask(editingTask.id, {
        title:       data.title,
        description: data.description || undefined,
        priority:    data.priority,
        dueDate:     data.dueDate || undefined,
      });
    } else {
      const created = await createTask({
        title:       data.title,
        description: data.description || undefined,
        priority:    data.priority,
        dueDate:     data.dueDate || undefined,
      });
      // Move to the intended column if not todo
      if (defaultStatus !== 'todo') {
        await updateTask(created.id, { status: defaultStatus });
      }
    }
  }

  async function handleStatusChange(id: string, status: TaskStatus) {
    await updateTask(id, { status });
  }

  // ─── Summary counts ───────────────────
  const total      = tasks.length;
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
  const overdue    = tasks.filter((t) => {
    if (!t.dueDate || t.status === 'done') return false;
    return t.dueDate < new Date().toISOString().slice(0, 10);
  }).length;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Header title="Tasks" />

      <div className="flex flex-1 flex-col overflow-auto">
        <div className="p-6 space-y-5">

          {/* ── Top bar ─────────────────────── */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              {/* Summary pills */}
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span><strong className="text-foreground">{total}</strong> tasks</span>
                {inProgress > 0 && (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                    {inProgress} in progress
                  </span>
                )}
                {overdue > 0 && (
                  <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/40 dark:text-red-300">
                    <AlertCircle className="h-3 w-3" />
                    {overdue} overdue
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* View toggle */}
              <div className="flex rounded-lg border border-border p-0.5">
                <button
                  onClick={() => setView('kanban')}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                    view === 'kanban'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  Kanban
                </button>
                <button
                  onClick={() => setView('list')}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                    view === 'list'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <List className="h-3.5 w-3.5" />
                  List
                </button>
              </div>

              {/* New task */}
              <button
                onClick={() => openCreate()}
                className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
              >
                <Plus className="h-4 w-4" />
                New Task
              </button>
            </div>
          </div>

          {/* ── Filters ─────────────────────── */}
          <TaskFilters filters={filters} onChange={setFilters} />

          {/* ── Error state ─────────────────── */}
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/20 dark:text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* ── Loading state ────────────────── */}
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-foreground" />
            </div>
          )}

          {/* ── Board / List ─────────────────── */}
          {!isLoading && view === 'kanban' && (
            <KanbanBoard
              tasks={tasks}
              onMove={moveTask}
              onEdit={openEdit}
              onDelete={deleteTask}
              onAddTask={(status) => openCreate(status)}
            />
          )}

          {!isLoading && view === 'list' && (
            <TaskListView
              tasks={tasks}
              onEdit={openEdit}
              onDelete={deleteTask}
              onStatusChange={handleStatusChange}
            />
          )}
        </div>
      </div>

      {/* ── Create / Edit modal ────────────── */}
      <TaskModal
        open={modalOpen}
        initial={editingTask}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
