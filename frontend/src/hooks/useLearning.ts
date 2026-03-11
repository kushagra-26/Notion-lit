'use client';

import { useCallback, useEffect, useState } from 'react';
import { learningApi } from '@/lib/api';
import type { LearningTopic } from '@/types';

export function useLearning() {
  const [topics, setTopics] = useState<LearningTopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await learningApi.list();
      setTopics(res.data);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const activeTopics = topics.filter((t) => t.status === 'active');
  const avgProgress =
    activeTopics.length > 0
      ? Math.round(activeTopics.reduce((sum, t) => sum + t.progress, 0) / activeTopics.length)
      : 0;

  return { topics, activeTopics, avgProgress, isLoading, reload: load };
}
