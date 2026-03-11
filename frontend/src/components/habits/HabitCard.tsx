'use client';

import { Check, Flame, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Habit } from '@/types';

interface HabitCardProps {
  habit: Habit;
  onToggle: (id: string) => void;
  onEdit: (habit: Habit) => void;
  onDelete: (id: string) => void;
}

export function HabitCard({ habit, onToggle, onEdit, onDelete }: HabitCardProps) {
  return (
    <div
      className={cn(
        'group relative flex items-center gap-4 rounded-lg border bg-card p-4 transition-all',
        habit.completedToday
          ? 'border-transparent ring-2'
          : 'border-border hover:border-border/80',
      )}
      style={
        habit.completedToday
          ? { '--tw-ring-color': habit.color } as React.CSSProperties
          : undefined
      }
    >
      {/* Color bar */}
      <div
        className="absolute left-0 top-0 h-full w-1 rounded-l-lg"
        style={{ backgroundColor: habit.color }}
      />

      {/* Toggle button */}
      <button
        onClick={() => onToggle(habit.id)}
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
          habit.completedToday
            ? 'text-white border-transparent'
            : 'border-border text-transparent hover:border-current',
        )}
        style={habit.completedToday ? { backgroundColor: habit.color } : undefined}
        title={habit.completedToday ? 'Mark incomplete' : 'Mark complete'}
      >
        <Check className="h-4 w-4" />
      </button>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {habit.icon && <span className="text-lg leading-none">{habit.icon}</span>}
          <p
            className={cn(
              'truncate text-sm font-medium',
              habit.completedToday && 'line-through text-muted-foreground',
            )}
          >
            {habit.name}
          </p>
        </div>
        {habit.description && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{habit.description}</p>
        )}
      </div>

      {/* Streak */}
      <div className="flex shrink-0 items-center gap-1 text-xs font-medium">
        <Flame
          className={cn('h-4 w-4', habit.streak > 0 ? 'text-orange-500' : 'text-muted-foreground/40')}
        />
        <span className={habit.streak > 0 ? 'text-orange-500' : 'text-muted-foreground/40'}>
          {habit.streak}d
        </span>
      </div>

      {/* Actions — show on hover */}
      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={() => onEdit(habit)}
          className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => onDelete(habit.id)}
          className="rounded p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/20 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
