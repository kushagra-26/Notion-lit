'use client';

import { Newspaper, RefreshCw, AlertCircle } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { NewsCard } from '@/components/news/NewsCard';
import { useNews } from '@/hooks/useNews';

// ─── Skeleton card ────────────────────────
function SkeletonCard() {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-card">
      <div className="h-44 animate-pulse bg-muted" />
      <div className="space-y-2 p-4">
        <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
        <div className="h-3 w-full animate-pulse rounded bg-muted" />
        <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}

export default function NewsPage() {
  const { articles, isLoading, error, refetch } = useNews();

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Header title="Tech News" />

      <div className="flex-1 p-6">
        {/* Page header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">Latest in Tech</h2>
            <p className="text-xs text-muted-foreground">
              Updated every 10 minutes · {articles.length} articles
            </p>
          </div>
          <button
            onClick={refetch}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Error state */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <div>
              <p className="text-sm font-medium text-destructive">Failed to load news</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Make sure <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">NEWS_API_KEY</code> is set in{' '}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">backend/.env</code> and the backend is running.
              </p>
            </div>
          </div>
        )}

        {/* Loading grid */}
        {isLoading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Empty state (not loading, no error, but no data — key not set) */}
        {!isLoading && !error && articles.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Newspaper className="mb-3 h-12 w-12 text-muted-foreground/30" />
            <p className="text-sm font-medium text-muted-foreground">No articles found</p>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground/70">
              Add your <code className="font-mono">NEWS_API_KEY</code> to{' '}
              <code className="font-mono">backend/.env</code> and restart the backend server.
              Get a free key at{' '}
              <span className="text-primary underline underline-offset-2">newsapi.org</span>
            </p>
          </div>
        )}

        {/* Articles grid */}
        {!isLoading && articles.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {articles.map((article, i) => (
              <NewsCard key={i} article={article} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
