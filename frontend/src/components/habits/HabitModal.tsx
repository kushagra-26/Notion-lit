'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { Habit } from '@/types';

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f59e0b', '#10b981', '#3b82f6', '#14b8a6',
];

const PRESET_ICONS = ['💪', '📚', '🏃', '💧', '🧘', '🎯', '✍️', '🎸',
                      '🥗', '🛌', '🧹', '💊', '🧠', '🌿', '🏋️', '🎨'];

interface HabitModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    description?: string;
    color: string;
    icon?: string;
    frequency: string;
  }) => Promise<void>;
  initial?: Habit;
}

export function HabitModal({ open, onClose, onSave, initial }: HabitModalProps) {
  const [name, setName]           = useState('');
  const [description, setDesc]    = useState('');
  const [color, setColor]         = useState(PRESET_COLORS[0]);
  const [icon, setIcon]           = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily');
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  useEffect(() => {
    if (initial) {
      setName(initial.name);
      setDesc(initial.description ?? '');
      setColor(initial.color ?? PRESET_COLORS[0]);
      setIcon(initial.icon ?? '');
      setFrequency((initial.frequency as 'daily' | 'weekly') ?? 'daily');
    } else {
      setName(''); setDesc(''); setColor(PRESET_COLORS[0]);
      setIcon(''); setFrequency('daily');
    }
    setError('');
  }, [initial, open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required'); return; }
    setSaving(true);
    try {
      await onSave({ name: name.trim(), description: description.trim() || undefined, color, icon: icon || undefined, frequency });
      onClose();
    } catch {
      setError('Failed to save habit');
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md rounded-xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold">{initial ? 'Edit Habit' : 'New Habit'}</h2>
          <button onClick={onClose} className="rounded p-1 text-muted-foreground hover:bg-accent transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <p className="rounded bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>}

          {/* Name */}
          <div>
            <label className="mb-1 block text-xs font-medium">Name *</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Morning workout"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-xs font-medium">Description</label>
            <input
              value={description}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Optional note"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Icon */}
          <div>
            <label className="mb-2 block text-xs font-medium">Icon</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_ICONS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setIcon(icon === e ? '' : e)}
                  className={`flex h-8 w-8 items-center justify-center rounded-md border text-lg transition-colors ${
                    icon === e ? 'border-primary bg-primary/10' : 'border-border hover:bg-accent'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="mb-2 block text-xs font-medium">Color</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${
                    color === c ? 'border-foreground scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Frequency */}
          <div>
            <label className="mb-2 block text-xs font-medium">Frequency</label>
            <div className="flex gap-2">
              {(['daily', 'weekly'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFrequency(f)}
                  className={`flex-1 rounded-md border px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                    frequency === f
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border hover:bg-accent'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-md border border-border px-4 py-2 text-sm transition-colors hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-60 hover:opacity-90"
            >
              {saving ? 'Saving…' : initial ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
