'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Plus, Pencil, Trash2, BookOpen, CheckCircle2, PauseCircle, Circle,
  Target, ChevronDown, ChevronUp,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { learningApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { LearningTopic, LearningStatus } from '@/types';

// ─── Status config ────────────────────────

const STATUS_CONFIG: Record<LearningStatus, { label: string; icon: typeof Circle; color: string; badge: string }> = {
  active:    { label: 'Active',    icon: Circle,        color: 'text-blue-500',   badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  completed: { label: 'Completed', icon: CheckCircle2,  color: 'text-green-500',  badge: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  paused:    { label: 'Paused',    icon: PauseCircle,   color: 'text-yellow-500', badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' },
};

const PROGRESS_COLOR = (p: number) =>
  p >= 80 ? 'bg-green-500' : p >= 50 ? 'bg-blue-500' : p >= 25 ? 'bg-yellow-500' : 'bg-red-400';

// ─── Modal ────────────────────────────────

interface ModalProps {
  initial?: LearningTopic | null;
  onClose: () => void;
  onSave: (data: Omit<LearningTopic, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

function TopicModal({ initial, onClose, onSave }: ModalProps) {
  const [name, setName]         = useState(initial?.name ?? '');
  const [desc, setDesc]         = useState(initial?.description ?? '');
  const [category, setCategory] = useState(initial?.category ?? '');
  const [progress, setProgress] = useState(initial?.progress ?? 0);
  const [status, setStatus]     = useState<LearningStatus>(initial?.status ?? 'active');
  const [resources, setResources] = useState(initial?.resources ?? '');
  const [targetDate, setTargetDate] = useState(initial?.targetDate ?? '');
  const [saving, setSaving]     = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({ name: name.trim(), description: desc || undefined, category: category || undefined, progress, status, resources: resources || undefined, targetDate: targetDate || undefined });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl space-y-4"
      >
        <h2 className="text-sm font-semibold">{initial ? 'Edit Topic' : 'New Learning Topic'}</h2>

        <div className="space-y-3">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Topic name *"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
          />
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Category (e.g. Backend, Algorithms)"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
          />
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Description"
            rows={2}
            className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
          />

          {/* Progress slider */}
          <div>
            <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span className="font-medium text-foreground">{progress}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>

          {/* Status */}
          <div className="flex gap-2">
            {(['active', 'paused', 'completed'] as LearningStatus[]).map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => setStatus(s)}
                className={cn(
                  'flex-1 rounded-lg border py-1.5 text-xs font-medium transition-colors',
                  status === s ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-accent',
                )}
              >
                {STATUS_CONFIG[s].label}
              </button>
            ))}
          </div>

          <input
            value={resources}
            onChange={(e) => setResources(e.target.value)}
            placeholder="Resources (URLs, notes, etc.)"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
          />
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-border py-2 text-sm hover:bg-accent transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!name.trim() || saving}
            className="flex-1 rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {saving ? 'Saving…' : initial ? 'Save' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Topic card ───────────────────────────

function TopicCard({
  topic,
  onEdit,
  onDelete,
}: {
  topic: LearningTopic;
  onEdit: (t: LearningTopic) => void;
  onDelete: (id: string) => void;
}) {
  const sc = STATUS_CONFIG[topic.status] ?? STATUS_CONFIG.active;
  const StatusIcon = sc.icon;

  return (
    <div className="group rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/30">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium leading-snug">{topic.name}</span>
            {topic.category && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{topic.category}</span>
            )}
            <span className={cn('flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium', sc.badge)}>
              <StatusIcon className="h-3 w-3" />
              {sc.label}
            </span>
          </div>
          {topic.description && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{topic.description}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(topic)}
            className="rounded p-1 text-muted-foreground hover:bg-accent transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(topic.id)}
            className="rounded p-1 text-muted-foreground hover:text-red-500 hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Progress</span>
          <span className="font-medium text-foreground">{topic.progress}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn('h-full rounded-full transition-all', PROGRESS_COLOR(topic.progress))}
            style={{ width: `${topic.progress}%` }}
          />
        </div>
      </div>

      {/* Footer */}
      {(topic.targetDate || topic.resources) && (
        <div className="mt-2.5 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          {topic.targetDate && (
            <span className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              Target: {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(topic.targetDate + 'T12:00:00Z'))}
            </span>
          )}
          {topic.resources && (
            <span className="truncate max-w-[200px]">{topic.resources}</span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────

export default function LearningPage() {
  const [topics, setTopics]     = useState<LearningTopic[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]   = useState<LearningTopic | null>(null);
  const [filter, setFilter]     = useState<LearningStatus | 'all'>('all');

  const fetchTopics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await learningApi.list();
      setTopics(res.data);
    } catch {
      setError('Failed to load topics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTopics(); }, [fetchTopics]);

  async function handleSave(data: Omit<LearningTopic, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) {
    if (editing) {
      const res = await learningApi.update(editing.id, data);
      setTopics((prev) => prev.map((t) => (t.id === editing.id ? res.data : t)));
    } else {
      const res = await learningApi.create(data);
      setTopics((prev) => [res.data, ...prev]);
    }
  }

  async function handleDelete(id: string) {
    setTopics((prev) => prev.filter((t) => t.id !== id));
    try { await learningApi.delete(id); } catch { fetchTopics(); }
  }

  const filtered = filter === 'all' ? topics : topics.filter((t) => t.status === filter);
  const active    = topics.filter((t) => t.status === 'active').length;
  const completed = topics.filter((t) => t.status === 'completed').length;
  const avgProgress = topics.length
    ? Math.round(topics.reduce((s, t) => s + t.progress, 0) / topics.length)
    : 0;

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Header title="Learning" />

      <div className="flex-1 p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Active',       value: active,      color: 'text-blue-500' },
            { label: 'Completed',    value: completed,   color: 'text-green-500' },
            { label: 'Avg Progress', value: `${avgProgress}%`, color: 'text-foreground' },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={cn('mt-1 text-2xl font-semibold', s.color)}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Header row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Filter tabs */}
          <div className="flex rounded-lg border border-border p-0.5">
            {(['all', 'active', 'paused', 'completed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors',
                  filter === f ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {f}
              </button>
            ))}
          </div>
          <button
            onClick={() => { setEditing(null); setModalOpen(true); }}
            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <Plus className="h-3.5 w-3.5" />
            New Topic
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-28 animate-pulse rounded-lg bg-muted" />)}
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
            <BookOpen className="mb-3 h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              {filter === 'all' ? 'No learning topics yet' : `No ${filter} topics`}
            </p>
            {filter === 'all' && (
              <button
                onClick={() => { setEditing(null); setModalOpen(true); }}
                className="mt-4 flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:opacity-90"
              >
                <Plus className="h-3.5 w-3.5" /> Add topic
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {filtered.map((t) => (
              <TopicCard
                key={t.id}
                topic={t}
                onEdit={(t) => { setEditing(t); setModalOpen(true); }}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <TopicModal
          initial={editing}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
