'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Task, TaskPriority } from '@/types';

export interface TaskFormData {
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: string;
}

interface Props {
  open: boolean;
  initial?: Task | null;       // null = create mode, Task = edit mode
  onClose: () => void;
  onSubmit: (data: TaskFormData) => Promise<void>;
}

const EMPTY: TaskFormData = {
  title: '',
  description: '',
  priority: 'medium',
  dueDate: '',
};

const PRIORITIES: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'low',    label: 'Low',    color: 'border-blue-400 text-blue-600'   },
  { value: 'medium', label: 'Medium', color: 'border-yellow-400 text-yellow-600' },
  { value: 'high',   label: 'High',   color: 'border-orange-400 text-orange-600' },
  { value: 'urgent', label: 'Urgent', color: 'border-red-500 text-red-600'     },
];

export function TaskModal({ open, initial, onClose, onSubmit }: Props) {
  const [form, setForm]       = useState<TaskFormData>(EMPTY);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const titleRef              = useRef<HTMLInputElement>(null);
  const isEdit                = !!initial;

  // Populate form from initial task or reset
  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({
        title:       initial.title,
        description: initial.description ?? '',
        priority:    initial.priority,
        dueDate:     initial.dueDate ?? '',
      });
    } else {
      setForm(EMPTY);
    }
    setError('');
    setTimeout(() => titleRef.current?.focus(), 50);
  }, [open, initial]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  function update(field: keyof TaskFormData, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { setError('Title is required'); return; }
    setSaving(true);
    setError('');
    try {
      await onSubmit(form);
      onClose();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Dialog */}
      <div
        className="relative z-10 w-full max-w-md rounded-xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold">
            {isEdit ? 'Edit Task' : 'New Task'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          {/* Title */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Title *
            </label>
            <input
              ref={titleRef}
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder="What needs to be done?"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              placeholder="Add details…"
              rows={3}
              className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="mb-2 block text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Priority
            </label>
            <div className="flex gap-2">
              {PRIORITIES.map(({ value, label, color }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => update('priority', value)}
                  className={cn(
                    'flex-1 rounded-md border py-1.5 text-xs font-medium transition-all',
                    form.priority === value
                      ? cn(color, 'bg-current/5')
                      : 'border-border text-muted-foreground hover:border-foreground/30',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Due date */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Due Date
            </label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => update('dueDate', e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-border px-4 py-2 text-sm hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60 transition-opacity"
            >
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
