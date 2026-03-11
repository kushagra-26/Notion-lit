'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MoreHorizontal, Trash2 } from 'lucide-react';
import { BlockEditor } from '@/components/editor/BlockEditor';
import { usePages } from '@/hooks/usePages';

export default function NoteEditorPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const router = useRouter();
  const { pages, isLoading, updatePageTitle, deletePage } = usePages();

  const page = pages.find((p) => p.id === id);
  const [title, setTitle] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Sync title from fetched page
  useEffect(() => {
    if (page) setTitle(page.title);
  }, [page]);

  // Close menu on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Debounced title save
  const titleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function handleTitleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const v = e.target.value;
    setTitle(v);
    if (titleTimer.current) clearTimeout(titleTimer.current);
    titleTimer.current = setTimeout(() => {
      updatePageTitle(id, v || 'Untitled');
    }, 600);
  }

  // Auto-resize title textarea
  const titleRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }, [title]);

  async function handleDelete() {
    await deletePage(id);
    router.push('/notes');
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-foreground" />
      </div>
    );
  }

  if (!page && !isLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2">
        <p className="text-sm font-medium">Page not found</p>
        <button
          onClick={() => router.push('/notes')}
          className="text-sm text-muted-foreground underline underline-offset-4 hover:opacity-80"
        >
          Back to notes
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex h-12 items-center justify-between border-b border-border px-4">
        <button
          onClick={() => router.push('/notes')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Notes
        </button>

        {/* Page actions menu */}
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setMenuOpen((p) => !p)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-40 rounded-lg border border-border bg-card shadow-lg">
              <div className="p-1">
                <button
                  onClick={handleDelete}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete page
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Editor area */}
      <div className="flex flex-1 flex-col overflow-auto">
        <div className="mx-auto w-full max-w-3xl px-12 py-10">
          {/* Page icon */}
          <div className="mb-4 text-4xl">{page?.icon || '📄'}</div>

          {/* Editable title */}
          <textarea
            ref={titleRef}
            value={title}
            onChange={handleTitleChange}
            onKeyDown={(e) => {
              // Move focus to first block on Enter/ArrowDown
              if (e.key === 'Enter' || e.key === 'ArrowDown') {
                e.preventDefault();
                const firstInput = document.querySelector<HTMLTextAreaElement>(
                  '.block-editor-area textarea',
                );
                firstInput?.focus();
              }
            }}
            placeholder="Untitled"
            rows={1}
            className="mb-4 w-full resize-none bg-transparent text-4xl font-bold tracking-tight outline-none placeholder:text-muted-foreground/30"
          />

          {/* Block editor */}
          <div className="block-editor-area">
            <BlockEditor pageId={id} />
          </div>
        </div>
      </div>
    </div>
  );
}
