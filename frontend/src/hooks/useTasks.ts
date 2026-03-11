'use client';

import { useCallback, useEffect, useState } from 'react';
import { tasksApi } from '@/lib/api';
import type { Task, TaskStatus, TaskPriority } from '@/types';

export interface TaskFilters {
  status?:   TaskStatus;
  priority?: TaskPriority;
  dueDate?:  'overdue' | 'today' | 'week';
}

function applyClientFilters(tasks: Task[], filters: TaskFilters): Task[] {
  let result = [...tasks];

  if (filters.status)   result = result.filter((t) => t.status   === filters.status);
  if (filters.priority) result = result.filter((t) => t.priority === filters.priority);

  if (filters.dueDate) {
    const now   = new Date();
    const today = now.toISOString().slice(0, 10);
    const week  = new Date(now.getTime() + 7 * 86400000).toISOString().slice(0, 10);

    result = result.filter((t) => {
      if (!t.dueDate) return false;
      if (filters.dueDate === 'overdue') return t.dueDate < today;
      if (filters.dueDate === 'today')   return t.dueDate === today;
      if (filters.dueDate === 'week')    return t.dueDate >= today && t.dueDate <= week;
      return true;
    });
  }

  return result;
}

export function useTasks(filters: TaskFilters = {}) {
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [error, setError]           = useState<string | null>(null);

  // ─── Fetch ──────────────────────────────
  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await tasksApi.list();
      setAllTasks(res.data);
    } catch {
      setError('Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  // ─── Create ─────────────────────────────
  const createTask = useCallback(
    async (data: {
      title: string;
      description?: string;
      priority?: string;
      dueDate?: string;
    }): Promise<Task> => {
      const res  = await tasksApi.create(data);
      const task: Task = res.data;
      setAllTasks((prev) => [task, ...prev]);
      return task;
    },
    [],
  );

  // ─── Update ─────────────────────────────
  const updateTask = useCallback(
    async (
      id: string,
      data: Partial<{
        title: string;
        description: string;
        priority: string;
        status: string;
        dueDate: string;
      }>,
    ): Promise<void> => {
      // Optimistic
      setAllTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...data } as Task : t)),
      );
      try {
        const res = await tasksApi.update(id, data);
        // Sync with server response
        setAllTasks((prev) =>
          prev.map((t) => (t.id === id ? res.data : t)),
        );
      } catch {
        // Revert on failure
        await fetchTasks();
        throw new Error('Failed to update task');
      }
    },
    [fetchTasks],
  );

  // ─── Delete ─────────────────────────────
  const deleteTask = useCallback(async (id: string): Promise<void> => {
    setAllTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      await tasksApi.delete(id);
    } catch {
      await fetchTasks();
      throw new Error('Failed to delete task');
    }
  }, [fetchTasks]);

  // ─── Move (drag-and-drop status change) ─
  const moveTask = useCallback(
    async (id: string, status: TaskStatus): Promise<void> => {
      await updateTask(id, { status });
    },
    [updateTask],
  );

  const tasks = applyClientFilters(allTasks, filters);

  return { tasks, allTasks, isLoading, error, createTask, updateTask, deleteTask, moveTask };
}
