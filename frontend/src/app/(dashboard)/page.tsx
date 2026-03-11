'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { CheckSquare, FileText, Flame, TrendingUp, ArrowRight, Circle, BarChart2, Github } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { NewsWidget } from '@/components/news/NewsWidget';
import { useTasks } from '@/hooks/useTasks';
import { usePages } from '@/hooks/usePages';
import { useHabits } from '@/hooks/useHabits';
import { useLearning } from '@/hooks/useLearning';
import { cn } from '@/lib/utils';
import type { Task, Page } from '@/types';

// ─── Priority dot colors ─────────────────
const PRIORITY_DOT: Record<string, string> = {
  urgent: 'text-red-500',
  high:   'text-orange-500',
  medium: 'text-yellow-500',
  low:    'text-blue-400',
};

// ─── Stat card ───────────────────────────
function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  href,
  loading,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  sub?: string;
  href?: string;
  loading?: boolean;
}) {
  const inner = (
    <div className="rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/30">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      {loading ? (
        <div className="mt-2 h-7 w-12 animate-pulse rounded bg-muted" />
      ) : (
        <p className="mt-2 text-2xl font-semibold">{value}</p>
      )}
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );

  return href ? <Link href={href}>{inner}</Link> : <>{inner}</>;
}

// ─── Today's tasks widget ────────────────
function TodayTasksWidget({ tasks, loading }: { tasks: Task[]; loading: boolean }) {
  return (
    <div className="flex flex-col rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium">Today's Tasks</h2>
        <Link
          href="/tasks"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-5 animate-pulse rounded bg-muted" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-6 text-center">
          <CheckSquare className="mb-2 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No tasks due today</p>
          <Link
            href="/tasks"
            className="mt-2 text-xs text-primary hover:underline underline-offset-2"
          >
            Create a task
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {tasks.slice(0, 6).map((t) => (
            <li key={t.id} className="flex items-start gap-2.5">
              <Circle
                className={cn(
                  'mt-0.5 h-2.5 w-2.5 shrink-0',
                  PRIORITY_DOT[t.priority] ?? 'text-muted-foreground',
                )}
                fill="currentColor"
              />
              <span
                className={cn(
                  'text-sm leading-tight',
                  t.status === 'done' && 'line-through text-muted-foreground',
                )}
              >
                {t.title}
              </span>
            </li>
          ))}
          {tasks.length > 6 && (
            <li className="text-xs text-muted-foreground pl-5">
              +{tasks.length - 6} more
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

// ─── Recent pages widget ─────────────────
function RecentPagesWidget({ pages, loading }: { pages: Page[]; loading: boolean }) {
  return (
    <div className="flex flex-col rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium">Recent Pages</h2>
        <Link
          href="/notes"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 animate-pulse rounded bg-muted" />
          ))}
        </div>
      ) : pages.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-6 text-center">
          <FileText className="mb-2 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No pages yet</p>
          <Link
            href="/notes"
            className="mt-2 text-xs text-primary hover:underline underline-offset-2"
          >
            Create a page
          </Link>
        </div>
      ) : (
        <ul className="space-y-0.5">
          {pages.slice(0, 6).map((p) => (
            <li key={p.id}>
              <Link
                href={`/notes/${p.id}`}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors"
              >
                <span className="text-base leading-none">{p.icon ?? '📄'}</span>
                <span className="truncate">{p.title || 'Untitled'}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Quick notes scratchpad ───────────────
const QUICK_NOTES_KEY = 'notion-lite:quick-notes';

function QuickNotes() {
  const [value, setValue] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Load persisted value on mount
  useEffect(() => {
    const saved = localStorage.getItem(QUICK_NOTES_KEY);
    if (saved) setValue(saved);
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setValue(text);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      localStorage.setItem(QUICK_NOTES_KEY, text);
    }, 500);
  }, []);

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h2 className="mb-3 text-sm font-medium">Quick Notes</h2>
      <textarea
        value={value}
        onChange={handleChange}
        placeholder="Start writing…"
        className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        rows={5}
      />
    </div>
  );
}

// ─── Page ────────────────────────────────
export default function DashboardPage() {
  const { allTasks, isLoading: tasksLoading } = useTasks({});
  const { pages, isLoading: pagesLoading }   = usePages();
  const { habits, bestStreak, todayCount: habitsToday, isLoading: habitsLoading } = useHabits();
  const { activeTopics, avgProgress, isLoading: learningLoading } = useLearning();

  const today = new Date().toISOString().slice(0, 10);

  const openTasks = useMemo(
    () => allTasks.filter((t) => t.status !== 'done' && t.status !== 'cancelled').length,
    [allTasks],
  );

  const dueTodayCount = useMemo(
    () => allTasks.filter((t) => t.dueDate === today && t.status !== 'done').length,
    [allTasks, today],
  );

  // Today's widget: due today OR in_progress, sorted by priority urgency
  const PRIORITY_ORDER: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
  const todayTasks = useMemo(
    () =>
      allTasks
        .filter(
          (t) =>
            t.status !== 'done' &&
            t.status !== 'cancelled' &&
            (t.dueDate === today || t.status === 'in_progress'),
        )
        .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 3) - (PRIORITY_ORDER[b.priority] ?? 3)),
    [allTasks, today],
  );

  // Recent pages sorted by updatedAt desc
  const recentPages = useMemo(
    () => [...pages].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [pages],
  );

  const lastEdited = useMemo(() => {
    if (!recentPages.length) return undefined;
    const diff = Date.now() - new Date(recentPages[0].updatedAt).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }, [recentPages]);

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Header title="Dashboard" />

      <div className="flex-1 p-6 space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            icon={CheckSquare}
            label="Open Tasks"
            value={tasksLoading ? '…' : openTasks}
            sub={dueTodayCount > 0 ? `${dueTodayCount} due today` : 'All caught up!'}
            href="/tasks"
            loading={tasksLoading}
          />
          <StatCard
            icon={FileText}
            label="Pages"
            value={pagesLoading ? '…' : pages.length}
            sub={lastEdited ? `Last edited ${lastEdited}` : 'No pages yet'}
            href="/notes"
            loading={pagesLoading}
          />
          <StatCard
            icon={Flame}
            label="Habit Streak"
            value={habitsLoading ? '…' : bestStreak > 0 ? `${bestStreak}d` : habits.length > 0 ? '0d' : '—'}
            sub={
              habitsLoading ? undefined
              : habits.length === 0 ? 'No habits yet'
              : `${habitsToday}/${habits.length} today`
            }
            href="/habits"
            loading={habitsLoading}
          />
          <StatCard
            icon={TrendingUp}
            label="Learning"
            value={learningLoading ? '…' : activeTopics.length > 0 ? `${activeTopics.length}` : '—'}
            sub={
              learningLoading ? undefined
              : activeTopics.length === 0 ? 'No active topics'
              : `${avgProgress}% avg progress`
            }
            href="/learning"
            loading={learningLoading}
          />
        </div>

        {/* Main widgets */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <TodayTasksWidget tasks={todayTasks} loading={tasksLoading} />
          <RecentPagesWidget pages={recentPages} loading={pagesLoading} />
        </div>

        {/* Quick notes */}
        <QuickNotes />

        {/* Tech News + Phase 3 placeholders */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Real news widget — spans 2 cols on large screens */}
          <div className="lg:col-span-2">
            <NewsWidget />
          </div>

          {/* Phase 3 quick links */}
          <div className="flex flex-col gap-4">
            <Link
              href="/stocks"
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/30"
            >
              <BarChart2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Stock Watchlist</p>
                <p className="text-xs text-muted-foreground">Track your stocks</p>
              </div>
              <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
            </Link>
            <Link
              href="/github"
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/30"
            >
              <Github className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">GitHub Dashboard</p>
                <p className="text-xs text-muted-foreground">Repos & activity</p>
              </div>
              <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
