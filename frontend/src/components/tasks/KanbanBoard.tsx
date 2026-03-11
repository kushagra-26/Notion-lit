'use client';

import { useState } from 'react';
import { TaskColumn, COLUMNS } from './TaskColumn';
import type { Task, TaskStatus } from '@/types';

interface Props {
  tasks: Task[];
  onMove: (taskId: string, status: TaskStatus) => Promise<void>;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onAddTask: (status: TaskStatus) => void;
}

export function KanbanBoard({ tasks, onMove, onEdit, onDelete, onAddTask }: Props) {
  const [draggingId, setDraggingId] = useState<string | null>(null);

  function handleDrop(taskId: string, status: TaskStatus) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === status) return; // no-op if same column
    setDraggingId(null);
    onMove(taskId, status);
  }

  return (
    <div
      className="flex gap-4 overflow-x-auto pb-4"
      onDragStart={(e) => {
        const id = (e.target as HTMLElement).closest('[draggable]')?.getAttribute('data-task-id');
        if (id) setDraggingId(id);
      }}
      onDragEnd={() => setDraggingId(null)}
    >
      {COLUMNS.map((col) => (
        <TaskColumn
          key={col.status}
          column={col}
          tasks={tasks.filter((t) => t.status === col.status)}
          draggingId={draggingId}
          onDrop={handleDrop}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddTask={onAddTask}
        />
      ))}
    </div>
  );
}
