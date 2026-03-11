'use client';

import { useCallback, useEffect, useState } from 'react';
import { habitsApi } from '@/lib/api';
import type { Habit } from '@/types';

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHabits = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await habitsApi.list();
      setHabits(res.data);
    } catch {
      setError('Failed to load habits');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchHabits(); }, [fetchHabits]);

  const createHabit = useCallback(async (data: {
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    frequency?: string;
  }): Promise<Habit> => {
    const res = await habitsApi.create(data);
    const habit: Habit = res.data;
    setHabits((prev) => [...prev, habit]);
    return habit;
  }, []);

  const updateHabit = useCallback(async (id: string, data: Partial<{
    name: string;
    description: string;
    color: string;
    icon: string;
    frequency: string;
  }>): Promise<void> => {
    const res = await habitsApi.update(id, data);
    setHabits((prev) => prev.map((h) => (h.id === id ? res.data : h)));
  }, []);

  const deleteHabit = useCallback(async (id: string): Promise<void> => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
    try {
      await habitsApi.delete(id);
    } catch {
      await fetchHabits();
    }
  }, [fetchHabits]);

  const toggleHabit = useCallback(async (id: string): Promise<void> => {
    // Optimistic update
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== id) return h;
        const completed = !h.completedToday;
        return {
          ...h,
          completedToday: completed,
          streak: completed ? h.streak + 1 : Math.max(0, h.streak - 1),
        };
      }),
    );
    try {
      const res = await habitsApi.toggle(id);
      // Sync with real streak from server
      setHabits((prev) =>
        prev.map((h) =>
          h.id === id
            ? { ...h, completedToday: res.data.completed, streak: res.data.streak }
            : h,
        ),
      );
    } catch {
      await fetchHabits();
    }
  }, [fetchHabits]);

  const todayCount = habits.filter((h) => h.completedToday).length;
  const bestStreak = habits.reduce((max, h) => Math.max(max, h.streak), 0);

  return { habits, isLoading, error, todayCount, bestStreak, createHabit, updateHabit, deleteHabit, toggleHabit };
}
