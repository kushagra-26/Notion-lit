'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, FileText, Trash2, Search } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { usePages } from '@/hooks/usePages';
import { formatRelativeDate } from '@/lib/utils';

export default function NotesPage() {
  const router = useRouter();
  const { pages, isLoading, createPage, deletePage } = usePages();
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);

  const filtered = query
    ? pages.filter((p) => p.title.toLowerCase().includes(query.toLowerCase()))
    : pages;

  async function handleCreate() {
    setCreating(true);
    try {
      const page = await createPage('Untitled');
      router.push(`/notes/${page.id}`);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Header title="Notes" />

      <div className="flex flex-1 flex-col overflow-auto p-6">
        {/* Top bar */}
        <div className="mb-6 flex items-center justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search notes…"
              className="w-full rounded-md border border-border bg-background pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
            />
          </div>

          <button
            onClick={handleCreate}
            disabled={creating}
            className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60 transition-opacity"
          >
            <Plus className="h-4 w-4" />
            New Page
          </button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-1 items-center justify-center">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-foreground" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && filtered.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-sm">
                {query ? 'No matching pages' : 'No pages yet'}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {query ? 'Try a different search' : 'Create your first page to get started'}
              </p>
            </div>
            {!query && (
              <button
                onClick={handleCreate}
                className="mt-2 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent transition-colors"
              >
                Create page
              </button>
            )}
          </div>
        )}

        {/* Pages grid */}
        {!isLoading && filtered.length > 0 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((page) => (
              <div
                key={page.id}
                className="group relative flex cursor-pointer flex-col rounded-lg border border-border bg-card p-4 hover:border-foreground/20 hover:shadow-sm transition-all"
                onClick={() => router.push(`/notes/${page.id}`)}
              >
                {/* Icon */}
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-md bg-muted text-base">
                  {page.icon || '📄'}
                </div>

                {/* Title */}
                <p className="text-sm font-medium leading-snug line-clamp-2">
                  {page.title || 'Untitled'}
                </p>

                {/* Meta */}
                <p className="mt-auto pt-3 text-xs text-muted-foreground">
                  {formatRelativeDate(page.updatedAt)}
                </p>

                {/* Delete button */}
                <button
                  className="absolute right-2 top-2 rounded p-1 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-red-500 transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    deletePage(page.id);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
