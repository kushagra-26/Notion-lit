'use client';

import { ExternalLink, Clock, Globe } from 'lucide-react';
import type { NewsArticle } from '@/lib/api';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface NewsCardProps {
  article: NewsArticle;
}

export function NewsCard({ article }: NewsCardProps) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-md">
      {/* Image */}
      {article.imageUrl ? (
        <div className="relative h-44 w-full overflow-hidden bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={article.imageUrl}
            alt={article.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      ) : (
        <div className="flex h-44 items-center justify-center bg-muted">
          <Globe className="h-10 w-10 text-muted-foreground/30" />
        </div>
      )}

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        {/* Source + time */}
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
            {article.source}
          </span>
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            {timeAgo(article.publishedAt)}
          </span>
        </div>

        {/* Title */}
        <h3 className="mb-2 line-clamp-2 text-sm font-semibold leading-snug">
          {article.title}
        </h3>

        {/* Description */}
        {article.description && (
          <p className="mb-3 line-clamp-3 flex-1 text-xs text-muted-foreground leading-relaxed">
            {article.description}
          </p>
        )}

        {/* Read more */}
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto flex items-center gap-1 text-xs font-medium text-primary hover:underline underline-offset-2"
        >
          Read full article
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </article>
  );
}
