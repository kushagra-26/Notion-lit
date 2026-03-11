'use client';

import { useCallback, useEffect, useState } from 'react';
import { pagesApi } from '@/lib/api';
import type { Page } from '@/types';

export function usePages() {
  const [pages, setPages] = useState<Page[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPages = useCallback(async () => {
    try {
      const res = await pagesApi.list();
      setPages(res.data);
    } catch {
      setError('Failed to load pages');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchPages(); }, [fetchPages]);

  const createPage = useCallback(async (title = 'Untitled') => {
    const res = await pagesApi.create({ title });
    const page: Page = res.data;
    setPages((prev) => [page, ...prev]);
    return page;
  }, []);

  const updatePageTitle = useCallback(async (id: string, title: string) => {
    setPages((prev) => prev.map((p) => (p.id === id ? { ...p, title } : p)));
    await pagesApi.update(id, { title });
  }, []);

  const deletePage = useCallback(async (id: string) => {
    setPages((prev) => prev.filter((p) => p.id !== id));
    await pagesApi.delete(id);
  }, []);

  return { pages, isLoading, error, createPage, updatePageTitle, deletePage };
}
