'use client';

import { useState } from 'react';
import { Flame, Plus, CheckCircle2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { HabitCard } from '@/components/habits/HabitCard';
import { HabitModal } from '@/components/habits/HabitModal';
import { useHabits } from '@/hooks/useHabits';
import type { Habit } from '@/types';

export default function HabitsPage() {
  const { habits, isLoading, todayCount, bestStreak, createHabit, updateHabit, deleteHabit, toggleHabit } = useHabits();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Habit | undefined>();

  function openCreate() { setEditing(undefined); setModalOpen(true); }
  function openEdit(h: Habit) { setEditing(h); setModalOpen(true); }

  async function handleSave(data: {
    name: string; description?: string; color: string; icon?: string; frequency: string;
  }) {
    if (editing) {
      await updateHabit(editing.id, data);
    } else {
      await createHabit(data);
    }
  }

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Header title="Habits" />

      <div className="flex-1 p-6 space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Today</p>
            <p className="mt-1 text-2xl font-semibold">
              {todayCount}<span className="text-sm font-normal text-muted-foreground">/{habits.length}</span>
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">completed</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Best Streak</p>
            <p className="mt-1 flex items-center gap-1 text-2xl font-semibold">
              <Flame className="h-5 w-5 text-orange-500" />
              {bestStreak}<span className="text-sm font-normal text-muted-foreground">d</span>
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Completion rate</p>
            <p className="mt-1 text-2xl font-semibold">
              {habits.length ? Math.round((todayCount / habits.length) * 100) : 0}
              <span className="text-sm font-normal text-muted-foreground">%</span>
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">today</p>
          </div>
        </div>

        {/* Habits list */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium">{today}</h2>
              {habits.length > 0 && todayCount === habits.length && (
                <p className="mt-0.5 flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  All habits completed!
                </p>
              )}
            </div>
            <button
              onClick={openCreate}
              className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity"
            >
              <Plus className="h-3.5 w-3.5" />
              New Habit
            </button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : habits.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
              <Flame className="mb-3 h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm font-medium text-muted-foreground">No habits yet</p>
              <p className="mt-1 text-xs text-muted-foreground/70">Create your first habit to start tracking</p>
              <button
                onClick={openCreate}
                className="mt-4 flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity"
              >
                <Plus className="h-3.5 w-3.5" /> Create habit
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {habits.map((habit) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  onToggle={toggleHabit}
                  onEdit={openEdit}
                  onDelete={deleteHabit}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <HabitModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        initial={editing}
      />
    </div>
  );
}
