'use client';

import Link from 'next/link';
import { ExternalLink, ArrowRight, Newspaper, RefreshCw } from 'lucide-react';
import { useNews } from '@/hooks/useNews';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function NewsWidget() {
  const { articles, isLoading, error, refetch } = useNews();
  const top5 = articles.slice(0, 5);

  return (
    <div className="flex flex-col rounded-lg border border-border bg-card p-4">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium">Tech News</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={refetch}
            disabled={isLoading}
            className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors disabled:opacity-40"
            title="Refresh"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            href="/news"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* States */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-1">
              <div className="h-3.5 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-3 w-1/4 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center py-6 text-center">
          <Newspaper className="mb-2 h-8 w-8 text-muted-foreground/30" />
          <p className="text-xs text-muted-foreground">
            {error === 'Failed to load news'
              ? 'Could not load news. Check your NEWS_API_KEY.'
              : error}
          </p>
        </div>
      ) : top5.length === 0 ? (
        <div className="flex flex-col items-center py-6 text-center">
          <Newspaper className="mb-2 h-8 w-8 text-muted-foreground/30" />
          <p className="text-xs text-muted-foreground">No news available</p>
          <p className="mt-1 text-[10px] text-muted-foreground/60">
            Add your NEWS_API_KEY to the backend .env
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {top5.map((article, i) => (
            <li key={i} className="group">
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2"
              >
                <span className="mt-0.5 shrink-0 text-xs font-mono text-muted-foreground/50 w-4">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-xs font-medium leading-snug group-hover:text-primary transition-colors">
                    {article.title}
                  </p>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground">{article.source}</span>
                    <span className="text-muted-foreground/40">·</span>
                    <span className="text-[10px] text-muted-foreground">{timeAgo(article.publishedAt)}</span>
                  </div>
                </div>
                <ExternalLink className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground/30 group-hover:text-primary transition-colors" />
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
