'use client';

import { useCallback, useEffect, useState } from 'react';
import { newsApi, type NewsArticle } from '@/lib/api';

export function useNews() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await newsApi.techNews();
      setArticles(res.data);
    } catch {
      setError('Failed to load news');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  return { articles, isLoading, error, refetch: fetchNews };
}
