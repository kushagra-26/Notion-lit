'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Github, Star, GitFork, ExternalLink, RefreshCw, GitCommit,
  GitPullRequest, AlertCircle, PlusCircle, BookOpen, Lock,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { githubApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { GithubProfile, GithubRepo, GithubEvent } from '@/types';

// ─── Helpers ─────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const EVENT_ICON: Record<string, typeof GitCommit> = {
  PushEvent:        GitCommit,
  PullRequestEvent: GitPullRequest,
  IssuesEvent:      AlertCircle,
  CreateEvent:      PlusCircle,
};

// ─── Language dot colors ─────────────────

const LANG_COLORS: Record<string, string> = {
  TypeScript: 'bg-blue-500',
  JavaScript: 'bg-yellow-400',
  Python:     'bg-green-500',
  Rust:       'bg-orange-600',
  Go:         'bg-cyan-500',
  Java:       'bg-red-500',
  'C++':      'bg-pink-500',
  C:          'bg-gray-500',
  CSS:        'bg-purple-500',
  HTML:       'bg-orange-400',
};

// ─── Sub-components ───────────────────────

function ProfileCard({ profile }: { profile: GithubProfile }) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={profile.avatarUrl}
        alt={profile.login}
        className="h-14 w-14 rounded-full border border-border"
      />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{profile.name || profile.login}</p>
        <p className="text-sm text-muted-foreground">@{profile.login}</p>
        {profile.bio && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{profile.bio}</p>}
      </div>
      <div className="flex gap-4 text-center shrink-0">
        {[
          { label: 'Repos',     value: profile.publicRepos },
          { label: 'Followers', value: profile.followers },
          { label: 'Following', value: profile.following },
        ].map((s) => (
          <div key={s.label}>
            <p className="text-lg font-semibold">{s.value}</p>
            <p className="text-[11px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
      <a
        href={profile.url}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent transition-colors"
      >
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}

function RepoCard({ repo }: { repo: GithubRepo }) {
  const dotColor = LANG_COLORS[repo.language] ?? 'bg-muted-foreground';

  return (
    <a
      href={repo.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/20"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {repo.isPrivate ? (
              <Lock className="h-3 w-3 shrink-0 text-muted-foreground" />
            ) : (
              <BookOpen className="h-3 w-3 shrink-0 text-muted-foreground" />
            )}
            <p className="truncate text-sm font-medium group-hover:text-primary transition-colors">{repo.name}</p>
          </div>
          {repo.description && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{repo.description}</p>
          )}
        </div>
        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
        {repo.language && (
          <span className="flex items-center gap-1">
            <span className={cn('h-2 w-2 rounded-full', dotColor)} />
            {repo.language}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Star className="h-3 w-3" />{repo.stars}
        </span>
        <span className="flex items-center gap-1">
          <GitFork className="h-3 w-3" />{repo.forks}
        </span>
        <span className="ml-auto">{timeAgo(repo.updatedAt)}</span>
      </div>
    </a>
  );
}

function ActivityItem({ event }: { event: GithubEvent }) {
  const Icon = EVENT_ICON[event.type] ?? GitCommit;
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium">{event.repoName}</p>
        <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{event.message}</p>
      </div>
      <span className="shrink-0 text-[11px] text-muted-foreground">{timeAgo(event.createdAt)}</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────

export default function GithubPage() {
  const [profile, setProfile]   = useState<GithubProfile | null>(null);
  const [repos, setRepos]       = useState<GithubRepo[]>([]);
  const [activity, setActivity] = useState<GithubEvent[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [p, r, a] = await Promise.all([
        githubApi.profile(),
        githubApi.repos(),
        githubApi.activity(),
      ]);
      setProfile(p.data);
      setRepos(r.data);
      setActivity(a.data);
    } catch {
      setError('Failed to load GitHub data. Make sure GITHUB_TOKEN is set in the backend .env file.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function handleRefresh() {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  }

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Header title="GitHub" />

      <div className="flex-1 p-6 space-y-6">
        {/* Refresh */}
        <div className="flex justify-end">
          <button
            onClick={handleRefresh}
            disabled={refreshing || isLoading}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
            Refresh
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <div className="h-24 animate-pulse rounded-lg bg-muted" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-28 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
            <Github className="mb-3 h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <p className="mt-2 text-xs text-muted-foreground/70">
              Add <code className="rounded bg-muted px-1 py-0.5">GITHUB_TOKEN</code> and{' '}
              <code className="rounded bg-muted px-1 py-0.5">GITHUB_USERNAME</code> to backend .env
            </p>
          </div>
        ) : (
          <>
            {/* Profile */}
            {profile && <ProfileCard profile={profile} />}

            {/* Repos + Activity */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Repos — spans 2 cols */}
              <div className="lg:col-span-2 space-y-3">
                <h2 className="text-sm font-semibold">Recent Repositories</h2>
                {repos.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No repositories found</p>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {repos.map((r) => <RepoCard key={r.id} repo={r} />)}
                  </div>
                )}
              </div>

              {/* Activity feed */}
              <div className="space-y-1">
                <h2 className="mb-2 text-sm font-semibold">Recent Activity</h2>
                <div className="rounded-lg border border-border bg-card px-3 divide-y divide-border">
                  {activity.length === 0 ? (
                    <p className="py-4 text-center text-xs text-muted-foreground">No recent activity</p>
                  ) : (
                    activity.slice(0, 12).map((e) => <ActivityItem key={e.id} event={e} />)
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
