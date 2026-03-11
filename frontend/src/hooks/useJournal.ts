'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { journalApi } from '@/lib/api';
import type { JournalEntry, JournalMood } from '@/types';

export function useJournal(date: string) {
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch list of past entries
  const fetchEntries = useCallback(async () => {
    try {
      const res = await journalApi.list();
      setEntries(res.data);
    } catch {
      // ignore
    }
  }, []);

  // Fetch entry for the selected date
  const fetchEntry = useCallback(async (d: string) => {
    setIsLoading(true);
    try {
      const res = await journalApi.byDate(d);
      setEntry(res.data ?? null);
    } catch {
      setEntry(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
    fetchEntry(date);
  }, [date, fetchEntries, fetchEntry]);

  // Debounced auto-save (600ms)
  const save = useCallback(
    (data: { title?: string; content?: string; mood?: string }) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        setIsSaving(true);
        try {
          const res = await journalApi.upsert({ date, ...data });
          setEntry(res.data);
          setEntries((prev) => {
            const exists = prev.find((e) => e.id === res.data.id);
            if (exists) return prev.map((e) => (e.id === res.data.id ? res.data : e));
            return [res.data, ...prev];
          });
        } finally {
          setIsSaving(false);
        }
      }, 600);
    },
    [date],
  );

  const deleteEntry = useCallback(async (id: string) => {
    await journalApi.delete(id);
    setEntry(null);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return { entry, entries, isLoading, isSaving, save, deleteEntry };
}
