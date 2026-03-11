'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { KanbanBoard } from '@/components/tasks/KanbanBoard';
import { TaskModal, type TaskFormData } from '@/components/tasks/TaskModal';
import { TaskFilters } from '@/components/tasks/TaskFilters';
import { useTasks } from '@/hooks/useTasks';
import type { Task, TaskStatus } from '@/types';
import type { TaskFilters as Filters } from '@/hooks/useTasks';

export default function KanbanPage() {
  const [filters, setFilters] = useState<Filters>({});
  const { tasks, allTasks, isLoading, error, createTask, updateTask, deleteTask, moveTask } = useTasks(filters);

  const [modalOpen, setModalOpen]     = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultStatus, setDefault]   = useState<TaskStatus>('todo');

  function openCreate(status: TaskStatus = 'todo') {
    setDefault(status);
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
      if (defaultStatus !== 'todo') {
        await updateTask(created.id, { status: defaultStatus });
      }
    }
  }

  const todo       = allTasks.filter((t) => t.status === 'todo').length;
  const inProgress = allTasks.filter((t) => t.status === 'in_progress').length;
  const done       = allTasks.filter((t) => t.status === 'done').length;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Header title="Kanban" />

      {/* Sub-header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span><strong className="text-foreground">{todo}</strong> to do</span>
          <span><strong className="text-blue-500">{inProgress}</strong> in progress</span>
          <span><strong className="text-green-500">{done}</strong> done</span>
        </div>
        <button
          onClick={() => openCreate('todo')}
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <Plus className="h-3.5 w-3.5" />
          New Task
        </button>
      </div>

      {/* Filters */}
      <div className="border-b border-border px-6 py-2">
        <TaskFilters filters={filters} onChange={setFilters} />
      </div>

      {/* Board — full height */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden px-6 py-4">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-foreground" />
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <KanbanBoard
            tasks={tasks}
            onMove={moveTask}
            onEdit={openEdit}
            onDelete={deleteTask}
            onAddTask={openCreate}
          />
        )}
      </div>

      <TaskModal
        open={modalOpen}
        initial={editingTask}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
