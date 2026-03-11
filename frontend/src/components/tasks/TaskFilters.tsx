'use client';

import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TaskFilters } from '@/hooks/useTasks';
import type { TaskPriority, TaskStatus } from '@/types';

interface Props {
  filters: TaskFilters;
  onChange: (filters: TaskFilters) => void;
}

const PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: 'urgent', label: 'Urgent' },
  { value: 'high',   label: 'High'   },
  { value: 'medium', label: 'Medium' },
  { value: 'low',    label: 'Low'    },
];

const STATUSES: { value: TaskStatus; label: string }[] = [
  { value: 'todo',        label: 'To Do'       },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done',        label: 'Done'        },
];

const DUE_DATES: { value: TaskFilters['dueDate']; label: string }[] = [
  { value: 'overdue', label: 'Overdue'    },
  { value: 'today',   label: 'Today'      },
  { value: 'week',    label: 'This week'  },
];

// ─── Pill button ─────────────────────────

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1 text-xs font-medium transition-all',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}

// ─── Component ───────────────────────────

export function TaskFilters({ filters, onChange }: Props) {
  function toggle<K extends keyof TaskFilters>(key: K, value: TaskFilters[K]) {
    onChange({ ...filters, [key]: filters[key] === value ? undefined : value });
  }

  function clearAll() {
    onChange({});
  }

  const hasFilters = !!(filters.status || filters.priority || filters.dueDate);

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Priority group */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">Priority:</span>
        <div className="flex gap-1">
          {PRIORITIES.map(({ value, label }) => (
            <Pill
              key={value}
              active={filters.priority === value}
              onClick={() => toggle('priority', value)}
            >
              {label}
            </Pill>
          ))}
        </div>
      </div>

      <div className="h-4 w-px bg-border" />

      {/* Status group */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">Status:</span>
        <div className="flex gap-1">
          {STATUSES.map(({ value, label }) => (
            <Pill
              key={value}
              active={filters.status === value}
              onClick={() => toggle('status', value)}
            >
              {label}
            </Pill>
          ))}
        </div>
      </div>

      <div className="h-4 w-px bg-border" />

      {/* Due date group */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">Due:</span>
        <div className="flex gap-1">
          {DUE_DATES.map(({ value, label }) => (
            <Pill
              key={value}
              active={filters.dueDate === value}
              onClick={() => toggle('dueDate', value)}
            >
              {label}
            </Pill>
          ))}
        </div>
      </div>

      {/* Clear all */}
      {hasFilters && (
        <button
          onClick={clearAll}
          className="flex items-center gap-1 rounded-full px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-3 w-3" />
          Clear
        </button>
      )}
    </div>
  );
}
