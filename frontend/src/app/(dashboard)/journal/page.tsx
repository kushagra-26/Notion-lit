'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, BookOpen, Save, Trash2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { useJournal } from '@/hooks/useJournal';
import { cn } from '@/lib/utils';
import type { JournalMood } from '@/types';

// ─── Mood config ─────────────────────────
const MOODS: { value: JournalMood; emoji: string; label: string; color: string }[] = [
  { value: 'great',    emoji: '😄', label: 'Great',    color: 'text-green-500' },
  { value: 'good',     emoji: '🙂', label: 'Good',     color: 'text-blue-500' },
  { value: 'okay',     emoji: '😐', label: 'Okay',     color: 'text-yellow-500' },
  { value: 'bad',      emoji: '😔', label: 'Bad',      color: 'text-orange-500' },
  { value: 'terrible', emoji: '😢', label: 'Terrible', color: 'text-red-500' },
];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00Z');
  return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}

function getLocalToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function isToday(dateStr: string): boolean {
  return dateStr === getLocalToday();
}

// ─── Date navigation ──────────────────────
// Use T12:00:00Z (noon UTC) to avoid local-timezone offsets flipping the date
function prevDay(d: string): string {
  const date = new Date(d + 'T12:00:00Z');
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}
function nextDay(d: string): string {
  const date = new Date(d + 'T12:00:00Z');
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

export default function JournalPage() {
  const [selectedDate, setSelectedDate] = useState(getLocalToday);
  const { entry, entries, isLoading, isSaving, save, deleteEntry } = useJournal(selectedDate);

  const [title, setTitle]     = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood]       = useState<JournalMood | ''>('');

  // Sync local state from loaded entry
  const [lastLoaded, setLastLoaded] = useState('');
  if (!isLoading && lastLoaded !== selectedDate) {
    setLastLoaded(selectedDate);
    setTitle(entry?.title ?? '');
    setContent(entry?.content ?? '');
    setMood((entry?.mood as JournalMood) ?? '');
  }

  function handleTitleChange(v: string) {
    setTitle(v);
    save({ title: v, content, mood: mood || undefined });
  }
  function handleContentChange(v: string) {
    setContent(v);
    save({ title, content: v, mood: mood || undefined });
  }
  function handleMoodChange(m: JournalMood) {
    const next = mood === m ? '' : m;
    setMood(next);
    save({ title, content, mood: next || undefined });
  }

  const isFuture = selectedDate > getLocalToday();

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left — entry list */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-card lg:flex">
        <div className="border-b border-border px-4 py-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Past entries</p>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {entries.length === 0 ? (
            <p className="px-4 py-3 text-xs text-muted-foreground">No entries yet</p>
          ) : (
            entries.map((e) => {
              const moodInfo = MOODS.find((m) => m.value === e.mood);
              return (
                <button
                  key={e.id}
                  onClick={() => setSelectedDate(e.date)}
                  className={cn(
                    'flex w-full items-start gap-2 px-4 py-2.5 text-left transition-colors hover:bg-accent',
                    selectedDate === e.date && 'bg-accent',
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium">
                      {isToday(e.date) ? 'Today' : e.date}
                    </p>
                    {e.title && (
                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{e.title}</p>
                    )}
                  </div>
                  {moodInfo && <span className="mt-0.5 text-sm">{moodInfo.emoji}</span>}
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* Right — editor */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header title="Journal" />

        <div className="flex flex-1 flex-col overflow-auto">
          <div className="mx-auto w-full max-w-2xl px-6 py-8">
            {/* Date navigation */}
            <div className="mb-6 flex items-center gap-3">
              <button
                onClick={() => setSelectedDate(prevDay(selectedDate))}
                className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex-1 text-center">
                <p className="text-sm font-medium">{formatDate(selectedDate)}</p>
                {isToday(selectedDate) && (
                  <span className="text-[10px] text-primary font-medium">Today</span>
                )}
              </div>
              <button
                onClick={() => setSelectedDate(nextDay(selectedDate))}
                disabled={isToday(selectedDate)}
                className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Save indicator */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                {isSaving ? (
                  <>
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                    Saving…
                  </>
                ) : entry ? (
                  <>
                    <Save className="h-3 w-3" /> Saved
                  </>
                ) : null}
              </div>
              {entry && (
                <button
                  onClick={() => deleteEntry(entry.id)}
                  className="flex items-center gap-1 rounded p-1 text-muted-foreground hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {isFuture ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <BookOpen className="mb-3 h-10 w-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">Can't write for a future date</p>
              </div>
            ) : isLoading ? (
              <div className="space-y-4">
                <div className="h-8 animate-pulse rounded bg-muted" />
                <div className="h-40 animate-pulse rounded bg-muted" />
              </div>
            ) : (
              <>
                {/* Mood selector */}
                <div className="mb-5">
                  <p className="mb-2 text-xs text-muted-foreground">How are you feeling?</p>
                  <div className="flex gap-2">
                    {MOODS.map((m) => (
                      <button
                        key={m.value}
                        onClick={() => handleMoodChange(m.value)}
                        title={m.label}
                        className={cn(
                          'flex flex-1 flex-col items-center gap-0.5 rounded-lg border py-2 transition-colors',
                          mood === m.value
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:bg-accent',
                        )}
                      >
                        <span className="text-lg">{m.emoji}</span>
                        <span className="text-[10px] text-muted-foreground">{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <input
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Entry title…"
                  className="mb-4 w-full bg-transparent text-2xl font-bold outline-none placeholder:text-muted-foreground/30"
                />

                {/* Content */}
                <textarea
                  value={content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder={`What's on your mind today?\n\nReflect on your day, your goals, or anything you want to remember…`}
                  className="min-h-[400px] w-full resize-none bg-transparent text-sm leading-relaxed outline-none placeholder:text-muted-foreground/40"
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
